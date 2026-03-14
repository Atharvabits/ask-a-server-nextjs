import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireVerified, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";
import { slugify, uploadToStorage } from "@/lib/helpers";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await requireVerified(user);

    const body = await request.json();
    const { title, body: postBody, link_url, photo_data, photo_filename, is_draft } = body;

    if (!title || !postBody) {
      return NextResponse.json({ detail: "Title and body required" }, { status: 400 });
    }

    if (is_draft) {
      const { count } = await supabase
        .from("blog_posts")
        .select("id", { count: "exact", head: true })
        .eq("author_id", user.id)
        .eq("status", "draft")
        .eq("is_admin_post", false);
      if ((count || 0) >= 1) {
        return NextResponse.json({ detail: "You can only have 1 draft at a time." }, { status: 400 });
      }
    }

    const wordCount = postBody.split(/\s+/).length;
    if (wordCount > 500) {
      return NextResponse.json({ detail: `Blog posts are limited to 500 words. Your post has ${wordCount} words.` }, { status: 400 });
    }

    let slug = slugify(title);
    const { data: existing } = await supabase.from("blog_posts").select("id").eq("slug", slug);
    if (existing?.length) slug = slug + "-" + String(Date.now() % 10000);

    const status = is_draft ? "draft" : "pending";
    let photoUrl = "";
    if (photo_data && photo_filename) {
      photoUrl = await uploadToStorage(photo_data, photo_filename, "blog");
    }

    const metaDesc = postBody.length > 155 ? postBody.slice(0, 155) + "..." : postBody;

    const { data: insertData } = await supabase
      .from("blog_posts")
      .insert({
        title,
        slug,
        body: postBody,
        photo_url: photoUrl,
        link_url: link_url || "",
        meta_description: metaDesc,
        author_id: user.id,
        contributor_id: user.id,
        status,
        is_admin_post: false,
      })
      .select("id");

    const postId = insertData?.[0]?.id || null;

    if (status === "pending") {
      try {
        await supabase.from("activity_log").insert({
          user_email: user.email || "",
          question: `Blog submission: ${title}`,
          event_type: "blog_submit",
        });
      } catch { /* non-critical */ }
    }

    return NextResponse.json({ ok: true, id: postId, slug, status });
  } catch (err) {
    return errorResponse(err);
  }
}
