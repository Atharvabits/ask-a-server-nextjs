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

    const { data: post } = await supabase.from("blog_posts").select("is_pinned").eq("id", postId).single();
    if (!post) return NextResponse.json({ detail: "Not found" }, { status: 404 });

    const newVal = !post.is_pinned;
    if (newVal) {
      const { count } = await supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("is_pinned", true);
      if ((count || 0) >= 3) {
        return NextResponse.json({ detail: "Maximum 3 pinned posts allowed." }, { status: 400 });
      }
    }

    await supabase.from("blog_posts").update({ is_pinned: newVal }).eq("id", postId);
    return NextResponse.json({ ok: true, is_pinned: newVal });
  } catch (err) {
    return errorResponse(err);
  }
}
