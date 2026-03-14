import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireVerified, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await requireVerified(user);

    const body = await request.json();
    const { post_id, vote } = body;

    if (vote !== 1 && vote !== -1) {
      return NextResponse.json({ detail: "Vote must be +1 or -1" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("blog_votes")
      .select("vote")
      .eq("post_id", post_id)
      .eq("user_id", user.id);

    if (existing?.length) {
      if (existing[0].vote === vote) {
        await supabase.from("blog_votes").delete().eq("post_id", post_id).eq("user_id", user.id);
      } else {
        await supabase.from("blog_votes").update({ vote }).eq("post_id", post_id).eq("user_id", user.id);
      }
    } else {
      await supabase.from("blog_votes").insert({ post_id, user_id: user.id, vote });
    }

    const { data: allVotes } = await supabase.from("blog_votes").select("vote").eq("post_id", post_id);
    const score = (allVotes || []).reduce((s, v) => s + v.vote, 0);
    await supabase.from("blog_posts").update({ score }).eq("id", post_id);

    const { count: upvotes } = await supabase.from("blog_votes").select("id", { count: "exact", head: true }).eq("post_id", post_id).eq("vote", 1);
    const { count: downvotes } = await supabase.from("blog_votes").select("id", { count: "exact", head: true }).eq("post_id", post_id).eq("vote", -1);

    return NextResponse.json({ ok: true, score, upvotes: upvotes || 0, downvotes: downvotes || 0 });
  } catch (err) {
    return errorResponse(err);
  }
}
