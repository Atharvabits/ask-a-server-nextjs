import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { data: posts } = await supabase.from("blog_posts").select("*").eq("status", "pending").order("created_at");
    if (!posts?.length) return NextResponse.json([]);

    const authorIds = [...new Set(posts.filter((p) => p.author_id).map((p) => String(p.author_id)))];
    const profiles: Record<string, Record<string, string>> = {};
    if (authorIds.length) {
      const { data: pData } = await supabase.from("profiles").select("id, display_name, email").in("id", authorIds);
      for (const pr of pData || []) profiles[String(pr.id)] = pr;
    }

    return NextResponse.json(posts.map((p) => {
      const pr = profiles[String(p.author_id || "")] || {};
      return { ...p, author_name: pr.display_name || null, author_email: pr.email || null };
    }));
  } catch (err) {
    return errorResponse(err);
  }
}
