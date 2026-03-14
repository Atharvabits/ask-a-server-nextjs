import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireVerified, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await requireVerified(user);

    const body = await request.json();
    const { state, title, content, company_name } = body;

    if (!state || !title || !content) {
      return NextResponse.json({ detail: "State, title, and content required" }, { status: 400 });
    }

    await supabase.from("feedback").insert({
      user_id: user.id,
      user_email: user.email || "",
      state,
      title,
      content,
      company_name: company_name || "",
    });

    try {
      await supabase.from("activity_log").insert({
        user_email: user.email || "",
        question: `Feedback: ${title}`,
        state_detected: state,
        event_type: "feedback",
      });
    } catch { /* non-critical */ }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
