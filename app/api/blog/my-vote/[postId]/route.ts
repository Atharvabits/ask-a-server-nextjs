import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await requireUser(request);
    const { postId } = await params;
    const { data } = await supabase
      .from("blog_votes")
      .select("vote")
      .eq("post_id", postId)
      .eq("user_id", user.id);
    return NextResponse.json({ vote: data?.length ? data[0].vote : 0 });
  } catch (err) {
    return errorResponse(err);
  }
}
