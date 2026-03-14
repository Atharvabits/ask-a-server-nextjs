import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    await requireAdmin(request);
    const { postId } = await params;
    const body = await request.json();
    await supabase.from("blog_posts").update({ status: "declined" }).eq("id", postId);
    await supabase.from("activity_log").insert({
      user_email: "admin", question: `Declined blog #${postId}: ${body.reason || ""}`, event_type: "blog_decline",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
