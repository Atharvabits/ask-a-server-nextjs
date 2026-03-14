import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin(request);
    const { userId } = await params;

    const { data } = await supabase
      .from("profiles")
      .select("id, email, role, display_name, company_name, phone, address_street, address_city, address_state, address_zip, company_description, website_url, profile_photo_url, profile_visibility, created_at")
      .eq("id", userId)
      .single();
    if (!data) return NextResponse.json({ detail: "Not found" }, { status: 404 });

    const result: Record<string, unknown> = { ...data };

    const { data: tags } = await supabase.from("user_tags").select("tag").eq("user_id", userId).order("created_at");
    result.tags = (tags || []).map((t) => t.tag);

    const { count: contribCount } = await supabase
      .from("blog_posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .or(`author_id.eq.${userId},contributor_id.eq.${userId}`);
    result.contribution_count = contribCount || 0;

    const { count: fbCount } = await supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "accepted");
    result.feedback_count = fbCount || 0;

    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
