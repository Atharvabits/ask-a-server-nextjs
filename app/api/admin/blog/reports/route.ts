import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { data: reports } = await supabase.from("blog_reports").select("*").eq("dismissed", false).order("created_at", { ascending: false });
    if (!reports?.length) return NextResponse.json([]);

    const postIds = [...new Set(reports.filter((r) => r.post_id).map((r) => r.post_id))];
    const reporterIds = [...new Set(reports.filter((r) => r.user_id).map((r) => String(r.user_id)))];

    const posts: Record<number, Record<string, unknown>> = {};
    if (postIds.length) {
      const { data: pData } = await supabase.from("blog_posts").select("id, title, slug, author_id").in("id", postIds);
      for (const p of pData || []) posts[p.id] = p;
    }

    const authorIds = [...new Set(Object.values(posts).filter((p) => p.author_id).map((p) => String(p.author_id)))];
    const allUserIds = [...new Set([...reporterIds, ...authorIds])];
    const profiles: Record<string, Record<string, string>> = {};
    if (allUserIds.length) {
      const { data: pData } = await supabase.from("profiles").select("id, email, display_name").in("id", allUserIds);
      for (const pr of pData || []) profiles[String(pr.id)] = pr;
    }

    return NextResponse.json(reports.map((r) => {
      const post = posts[r.post_id] || {};
      const reporter = profiles[String(r.user_id || "")] || {};
      const author = profiles[String(post.author_id || "")] || {};
      return {
        ...r,
        post_title: post.title || null,
        post_slug: post.slug || null,
        post_author_id: post.author_id || null,
        reporter_email: reporter.email || null,
        reporter_name: reporter.display_name || null,
        author_email: author.email || null,
        author_name: author.display_name || null,
      };
    }));
  } catch (err) {
    return errorResponse(err);
  }
}
