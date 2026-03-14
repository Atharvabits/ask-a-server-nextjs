import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { data } = await supabase.from("page_views").select("page, duration_seconds");

    const pageData: Record<string, number[]> = {};
    for (const row of data || []) {
      if (row.page) {
        if (!pageData[row.page]) pageData[row.page] = [];
        pageData[row.page].push(row.duration_seconds || 0);
      }
    }

    const result = Object.entries(pageData).map(([page, durations]) => {
      const total = durations.reduce((a, b) => a + b, 0);
      return { page, views: durations.length, total_seconds: total, avg_seconds: total / durations.length };
    }).sort((a, b) => b.total_seconds - a.total_seconds);

    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
