import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const category = request.nextUrl.searchParams.get("category") || "";
    const q = request.nextUrl.searchParams.get("q") || "";

    let query = supabase.from("app_feedback").select("*");
    if (category) query = query.eq("category", category);
    if (q) query = query.or(`description.ilike.%${q}%,resolution_summary.ilike.%${q}%`);
    const { data: rows } = await query.order("created_at", { ascending: false });

    if (!rows?.length) return NextResponse.json([]);

    const fbIds = rows.map((r) => r.id);
    const { data: comments } = await supabase
      .from("app_feedback_comments")
      .select("*")
      .in("feedback_id", fbIds)
      .order("created_at");

    const commentUserIds = [...new Set((comments || []).filter((c) => c.user_id).map((c) => String(c.user_id)))];
    const userMap: Record<string, string> = {};
    if (commentUserIds.length) {
      const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", commentUserIds);
      for (const p of profiles || []) userMap[String(p.id)] = p.display_name;
    }

    const commentsByFb: Record<number, unknown[]> = {};
    for (const c of comments || []) {
      if (!commentsByFb[c.feedback_id]) commentsByFb[c.feedback_id] = [];
      commentsByFb[c.feedback_id].push({ ...c, display_name: userMap[String(c.user_id)] || null });
    }

    return NextResponse.json(rows.map((r) => {
      let screenshotUrls = r.screenshot_urls;
      if (typeof screenshotUrls === "string") {
        try { screenshotUrls = JSON.parse(screenshotUrls); } catch { screenshotUrls = []; }
      }
      return { ...r, screenshot_urls: screenshotUrls || [], comments: commentsByFb[r.id] || [] };
    }));
  } catch (err) {
    return errorResponse(err);
  }
}
