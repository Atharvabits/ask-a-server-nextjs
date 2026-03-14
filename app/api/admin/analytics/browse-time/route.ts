import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { data: allData } = await supabase.from("visitor_sessions").select("total_seconds").gt("total_seconds", 0);
    const totalSessions = allData?.length || 0;
    const avgSeconds = totalSessions > 0
      ? (allData || []).reduce((s, r) => s + r.total_seconds, 0) / totalSessions
      : 0;

    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data: dailyData } = await supabase
      .from("visitor_sessions")
      .select("started_at, total_seconds")
      .gt("total_seconds", 0)
      .gte("started_at", cutoff);

    const daily: Record<string, number[]> = {};
    for (const row of dailyData || []) {
      const d = (row.started_at || "").slice(0, 10);
      if (d) {
        if (!daily[d]) daily[d] = [];
        daily[d].push(row.total_seconds);
      }
    }

    return NextResponse.json({
      total_sessions: totalSessions,
      avg_minutes: avgSeconds / 60,
      daily: Object.entries(daily)
        .map(([date, secs]) => ({
          date,
          sessions: secs.length,
          avg_minutes: secs.reduce((a, b) => a + b, 0) / secs.length / 60,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
