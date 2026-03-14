import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published");

    if (!posts?.length) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    const post = posts[0];
    const postId = post.id;

    const authorId = post.contributor_id || post.author_id;
    let authorProfile: Record<string, string> = {};
    if (authorId) {
      const { data: apr } = await supabase
        .from("profiles")
        .select("id, display_name, company_name, profile_photo_url, role")
        .eq("id", authorId);
      if (apr?.length) authorProfile = apr[0];
    }

    let contributorName = null;
    if (post.contributor_id) {
      const { data: cpr } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", post.contributor_id);
      if (cpr?.length) contributorName = cpr[0].display_name;
    }

    const { count: upvotes } = await supabase.from("blog_votes").select("id", { count: "exact", head: true }).eq("post_id", postId).eq("vote", 1);
    const { count: downvotes } = await supabase.from("blog_votes").select("id", { count: "exact", head: true }).eq("post_id", postId).eq("vote", -1);

    const result: Record<string, unknown> = {
      ...post,
      author_name: authorProfile.display_name || null,
      author_company: authorProfile.company_name || null,
      author_photo_url: authorProfile.profile_photo_url || null,
      author_role: authorProfile.role || null,
      author_user_id: authorId,
      contributor_name: contributorName,
      upvotes: upvotes || 0,
      downvotes: downvotes || 0,
    };

    const currentUser = await getUser(request);
    if (currentUser) {
      const { data: voteData } = await supabase
        .from("blog_votes")
        .select("vote")
        .eq("post_id", postId)
        .eq("user_id", currentUser.id);
      result.user_vote = voteData?.length ? voteData[0].vote : 0;
    } else {
      result.user_vote = 0;
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
