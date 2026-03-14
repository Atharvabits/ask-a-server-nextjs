import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, email, display_name, company_name, phone, company_description, profile_photo_url, address_street, address_city, address_state, address_zip, website_url, profile_visibility, role")
      .eq("id", userId);

    if (!profileData?.length) return NextResponse.json({ detail: "Not found" }, { status: 404 });

    const { data: contribs } = await supabase
      .from("state_laws")
      .select("id, state, title, created_at")
      .eq("credit_user_id", userId)
      .order("created_at", { ascending: false });

    const { data: allPosts } = await supabase
      .from("blog_posts")
      .select("id, title, slug, published_at, author_id, contributor_id")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    const blogPosts = (allPosts || []).filter(
      (bp) => bp.author_id === userId || bp.contributor_id === userId
    );

    return NextResponse.json({
      profile: profileData[0],
      contributions: contribs || [],
      blog_posts: blogPosts,
    });
  } catch {
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
