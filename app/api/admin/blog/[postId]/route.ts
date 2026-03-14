import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";
import { slugify, uploadToStorage } from "@/lib/helpers";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    await requireAdmin(request);
    const { postId } = await params;
    const body = await request.json();

    const { data: post } = await supabase.from("blog_posts").select("published_at").eq("id", postId).single();
    if (!post) return NextResponse.json({ detail: "Not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};
    for (const field of ["title", "body", "link_url", "meta_description", "meta_keywords", "status"]) {
      if (body[field] !== undefined) updates[field] = body[field];
    }
    if (body.title) updates.slug = slugify(body.title);
    if (body.train_ai !== undefined) updates.train_ai = Boolean(body.train_ai);
    if (body.is_pinned !== undefined) updates.is_pinned = Boolean(body.is_pinned);
    if (body.contributor_id !== undefined) updates.contributor_id = body.contributor_id;
    if (body.photo_data && body.photo_filename) {
      updates.photo_url = await uploadToStorage(body.photo_data, body.photo_filename, "blog");
    }
    if (body.status === "published" && !post.published_at) {
      updates.published_at = new Date().toISOString();
    }
    updates.updated_at = new Date().toISOString();

    if (Object.keys(updates).length) {
      await supabase.from("blog_posts").update(updates).eq("id", postId);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    await requireAdmin(request);
    const { postId } = await params;
    await supabase.from("blog_votes").delete().eq("post_id", postId);
    await supabase.from("blog_reports").delete().eq("post_id", postId);
    await supabase.from("blog_posts").delete().eq("id", postId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
