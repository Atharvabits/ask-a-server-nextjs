import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fbId: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { fbId } = await params;
    const body = await request.json();
    if (!body.title || !body.content) {
      return NextResponse.json({ detail: "Title and content required" }, { status: 400 });
    }

    const { data: fb } = await supabase.from("feedback").select("*").eq("id", fbId).single();
    if (!fb) return NextResponse.json({ detail: "Not found" }, { status: 404 });

    const { data: lawData } = await supabase.from("state_laws").insert({
      state: fb.state, title: body.title, content: body.content,
      added_by: "feedback", credit_company: body.credit_company || "",
      credit_user_id: fb.user_id,
    }).select("id");

    const lawId = lawData?.[0]?.id || null;
    await supabase.from("feedback").update({ status: "accepted", state_law_id: lawId }).eq("id", fbId);

    await supabase.from("activity_log").insert({
      user_email: admin.email, question: `Accepted feedback: ${body.title}`,
      state_detected: fb.state, event_type: "feedback_accept",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
