import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { count: totalUsers } = await supabase.from("profiles").select("id", { count: "exact", head: true });
    const { count: totalQuestions } = await supabase.from("activity_log").select("id", { count: "exact", head: true }).eq("event_type", "question");
    const { count: totalClicks } = await supabase.from("click_log").select("id", { count: "exact", head: true });

    const { data: clicksData } = await supabase.from("click_log").select("state").not("state", "is", null);
    const stateCounts: Record<string, number> = {};
    for (const r of clicksData || []) {
      if (r.state) stateCounts[r.state] = (stateCounts[r.state] || 0) + 1;
    }
    const clicksByState = Object.entries(stateCounts)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return NextResponse.json({
      total_users: totalUsers || 0,
      total_questions: totalQuestions || 0,
      total_clicks: totalClicks || 0,
      clicks_by_state: clicksByState,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
