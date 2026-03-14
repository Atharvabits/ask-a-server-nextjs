import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data } = await supabase.from("activity_log").select("created_at").eq("event_type", "login").gte("created_at", cutoff);

    const dateCounts: Record<string, number> = {};
    for (const row of data || []) {
      const d = (row.created_at || "").slice(0, 10);
      if (d) dateCounts[d] = (dateCounts[d] || 0) + 1;
    }

    return NextResponse.json(
      Object.entries(dateCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
    );
  } catch (err) {
    return errorResponse(err);
  }
}
