import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { data } = await supabase.from("visitor_sessions").select("city, region, country");

    const counts: Record<string, number> = {};
    const entries: Record<string, { city: string; region: string; country: string }> = {};
    for (const row of data || []) {
      const city = row.city || "";
      const region = row.region || "";
      const country = row.country || "";
      if (city || region) {
        const key = `${city}|${region}|${country}`;
        counts[key] = (counts[key] || 0) + 1;
        entries[key] = { city, region, country };
      }
    }

    const result = Object.entries(counts)
      .map(([key, sessions]) => ({ ...entries[key], sessions }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 30);

    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
