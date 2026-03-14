import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { data: keywords } = await supabase.from("keyword_scores").select("keyword, category, score, last_seen").order("score", { ascending: false }).limit(50);
    const { data: states } = await supabase.from("state_scores").select("state, score, last_seen").order("score", { ascending: false }).limit(20);
    return NextResponse.json({ keywords: keywords || [], states: states || [] });
  } catch (err) {
    return errorResponse(err);
  }
}
