import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";
import { slugify, uploadToStorage } from "@/lib/helpers";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { data: posts } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    if (!posts?.length) return NextResponse.json([]);

    const userIds = new Set<string>();
    for (const p of posts) {
      const uid = p.contributor_id || p.author_id;
      if (uid) userIds.add(String(uid));
    }

    const profiles: Record<string, Record<string, string>> = {};
    if (userIds.size) {
      const { data: pData } = await supabase.from("profiles").select("id, display_name, email, role, profile_photo_url").in("id", [...userIds]);
      for (const pr of pData || []) profiles[String(pr.id)] = pr;
    }

    const postIds = posts.map((p) => p.id);
    const { data: upVotes } = await supabase.from("blog_votes").select("post_id").in("post_id", postIds).eq("vote", 1);
    const { data: downVotes } = await supabase.from("blog_votes").select("post_id").in("post_id", postIds).eq("vote", -1);
    const { data: reports } = await supabase.from("blog_reports").select("post_id").in("post_id", postIds).eq("dismissed", false);

    const upCounts: Record<number, number> = {};
    const downCounts: Record<number, number> = {};
    const reportCounts: Record<number, number> = {};
    for (const v of upVotes || []) upCounts[v.post_id] = (upCounts[v.post_id] || 0) + 1;
    for (const v of downVotes || []) downCounts[v.post_id] = (downCounts[v.post_id] || 0) + 1;
    for (const r of reports || []) reportCounts[r.post_id] = (reportCounts[r.post_id] || 0) + 1;

    return NextResponse.json(posts.map((p) => {
      const uid = String(p.contributor_id || p.author_id || "");
      const pr = profiles[uid] || {};
      return {
        ...p,
        author_name: pr.display_name || null,
        author_email: pr.email || null,
        author_role: pr.role || null,
        author_photo_url: pr.profile_photo_url || null,
        upvotes: upCounts[p.id] || 0,
        downvotes: downCounts[p.id] || 0,
        report_count: reportCounts[p.id] || 0,
      };
    }));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();

    if (!body.title || !body.body) {
      return NextResponse.json({ detail: "Title and body required" }, { status: 400 });
    }

    let slug = slugify(body.title);
    const { data: existing } = await supabase.from("blog_posts").select("id").eq("slug", slug);
    if (existing?.length) slug = slug + "-" + String(Date.now() % 10000);

    let photoUrl = "";
    if (body.photo_data && body.photo_filename) {
      photoUrl = await uploadToStorage(body.photo_data, body.photo_filename, "blog");
    }

    const metaDesc = body.meta_description || (body.body.length > 155 ? body.body.slice(0, 155) + "..." : body.body);
    const status = body.status || "draft";
    const publishedAt = status === "published" ? new Date().toISOString() : null;

    const { data: postData } = await supabase.from("blog_posts").insert({
      title: body.title, slug, body: body.body, photo_url: photoUrl,
      link_url: body.link_url || "", meta_description: metaDesc,
      meta_keywords: body.meta_keywords || "", author_id: admin.id,
      contributor_id: body.contributor_id || null, status,
      is_admin_post: true, train_ai: body.train_ai || false,
      published_at: publishedAt,
    }).select("id");

    if (status === "published") {
      await supabase.from("activity_log").insert({
        user_email: admin.email, question: `Published blog: ${body.title}`, event_type: "blog_publish",
      });
    }

    return NextResponse.json({ ok: true, id: postData?.[0]?.id, slug });
  } catch (err) {
    return errorResponse(err);
  }
}
