import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    await requireAdmin(request);
    const { postId } = await params;

    const { data: post } = await supabase.from("blog_posts").select("status, published_at").eq("id", postId).single();
    if (!post) return NextResponse.json({ detail: "Not found" }, { status: 404 });

    let newStatus: string;
    const updates: Record<string, unknown> = {};

    if (post.status === "hidden") {
      newStatus = "published";
      updates.status = newStatus;
      if (!post.published_at) updates.published_at = new Date().toISOString();
    } else {
      newStatus = "hidden";
      updates.status = newStatus;
    }

    await supabase.from("blog_posts").update(updates).eq("id", postId);
    return NextResponse.json({ ok: true, status: newStatus });
  } catch (err) {
    return errorResponse(err);
  }
}
