import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";
import { slugify } from "@/lib/helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { postId } = await params;
    const body = await request.json();

    const { data: post } = await supabase.from("blog_posts").select("*").eq("id", postId).single();
    if (!post) return NextResponse.json({ detail: "Not found" }, { status: 404 });

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {
      status: "published", published_at: now, updated_at: now,
    };
    let adminEdited = false;

    if (body.title && body.title !== post.title) {
      updates.title = body.title;
      updates.slug = slugify(body.title);
      adminEdited = true;
    }
    if (body.body && body.body !== post.body) {
      updates.body = body.body;
      adminEdited = true;
    }
    if (body.meta_description !== undefined) updates.meta_description = body.meta_description;
    if (body.train_ai !== undefined) updates.train_ai = Boolean(body.train_ai);
    if (body.contributor_id !== undefined) updates.contributor_id = body.contributor_id;
    if (adminEdited) updates.admin_edited = true;

    await supabase.from("blog_posts").update(updates).eq("id", postId);
    await supabase.from("activity_log").insert({
      user_email: admin.email, question: `Approved blog: ${post.title}`, event_type: "blog_publish",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
