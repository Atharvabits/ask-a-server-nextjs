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
    const comment = (body.comment || "").trim();
    if (!comment) return NextResponse.json({ detail: "Comment is required" }, { status: 400 });
    await supabase.from("app_feedback_comments").insert({
      feedback_id: parseInt(fbId, 10), user_id: admin.id, user_email: admin.email, comment,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
