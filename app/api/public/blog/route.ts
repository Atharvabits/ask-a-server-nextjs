import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
    const perPage = parseInt(request.nextUrl.searchParams.get("per_page") || "20", 10);
    const offset = (page - 1) * perPage;

    const { data: posts } = await supabase
      .from("blog_posts")
      .select("id, title, slug, body, photo_url, link_url, meta_description, author_id, contributor_id, is_admin_post, is_pinned, score, created_at, published_at")
      .eq("status", "published")
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .range(offset, offset + perPage - 1);

    if (!posts?.length) return NextResponse.json([]);

    const authorIds = [...new Set(posts.map((p) => p.contributor_id || p.author_id).filter(Boolean))];
    const profileMap: Record<string, Record<string, string>> = {};
    if (authorIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, company_name, profile_photo_url, role")
        .in("id", authorIds);
      for (const pr of profiles || []) profileMap[pr.id] = pr;
    }

    const postIds = posts.map((p) => p.id);
    const upMap: Record<number, number> = {};
    const downMap: Record<number, number> = {};

    for (const pid of postIds) {
      const { count: up } = await supabase.from("blog_votes").select("id", { count: "exact", head: true }).eq("post_id", pid).eq("vote", 1);
      const { count: down } = await supabase.from("blog_votes").select("id", { count: "exact", head: true }).eq("post_id", pid).eq("vote", -1);
      upMap[pid] = up || 0;
      downMap[pid] = down || 0;
    }

    const result = posts.map((p) => {
      const authorId = p.contributor_id || p.author_id;
      const pr = profileMap[authorId] || {};
      return {
        ...p,
        author_name: pr.display_name || null,
        author_company: pr.company_name || null,
        author_photo_url: pr.profile_photo_url || null,
        author_role: pr.role || null,
        author_user_id: authorId,
        upvotes: upMap[p.id] || 0,
        downvotes: downMap[p.id] || 0,
      };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
