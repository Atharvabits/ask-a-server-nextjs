import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireVerified, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await requireVerified(user);

    const body = await request.json();
    const { post_id, reason } = body;

    if (!["spam", "false_info", "duplicate_stolen"].includes(reason)) {
      return NextResponse.json({ detail: "Invalid reason" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("blog_reports")
      .select("id")
      .eq("post_id", post_id)
      .eq("user_id", user.id);

    if (existing?.length) return NextResponse.json({ ok: true, message: "Already reported" });

    await supabase.from("blog_reports").insert({ post_id, user_id: user.id, reason });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
