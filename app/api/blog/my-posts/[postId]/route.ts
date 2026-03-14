import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireVerified, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";
import { slugify, uploadToStorage } from "@/lib/helpers";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await requireUser(request);
    await requireVerified(user);
    const { postId } = await params;

    const { data: posts } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", postId)
      .eq("author_id", user.id)
      .eq("is_admin_post", false);

    if (!posts?.length) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    const post = posts[0];

    if (!["draft", "pending", "declined", "published"].includes(post.status)) {
      return NextResponse.json({ detail: "Cannot edit this post." }, { status: 400 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) {
      updates.title = body.title;
      updates.slug = slugify(body.title);
    }
    if (body.body !== undefined) {
      const wordCount = body.body.split(/\s+/).length;
      if (wordCount > 500) {
        return NextResponse.json({ detail: `Blog posts limited to 500 words. Yours has ${wordCount}.` }, { status: 400 });
      }
      updates.body = body.body;
      updates.meta_description = body.body.length > 155 ? body.body.slice(0, 155) + "..." : body.body;
    }
    if (body.link_url !== undefined) updates.link_url = body.link_url;
    if (body.photo_data && body.photo_filename) {
      updates.photo_url = await uploadToStorage(body.photo_data, body.photo_filename, "blog");
    }
    if (body.is_draft !== undefined) {
      updates.status = body.is_draft ? "draft" : "pending";
    } else if (post.status === "published") {
      updates.status = "pending";
      updates.admin_edited = false;
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
    const user = await requireUser(request);
    await requireVerified(user);
    const { postId } = await params;

    const { data: posts } = await supabase
      .from("blog_posts")
      .select("id, status")
      .eq("id", postId)
      .eq("author_id", user.id)
      .eq("is_admin_post", false);

    if (!posts?.length) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    if (posts[0].status === "published") {
      return NextResponse.json({ detail: "Cannot delete published posts. Contact admin." }, { status: 400 });
    }

    await supabase.from("blog_posts").delete().eq("id", postId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
