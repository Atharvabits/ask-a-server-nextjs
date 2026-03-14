import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { data } = await supabase
      .from("blog_posts")
      .select("id, title, slug, body, photo_url, link_url, status, score, created_at, published_at, updated_at, meta_description, admin_edited")
      .eq("author_id", user.id)
      .eq("is_admin_post", false)
      .order("created_at", { ascending: false });
    return NextResponse.json(data || []);
  } catch (err) {
    return errorResponse(err);
  }
}
