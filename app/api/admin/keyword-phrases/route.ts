import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const category = request.nextUrl.searchParams.get("category") || "";
    const q = request.nextUrl.searchParams.get("q") || "";
    let query = supabase.from("keyword_phrases").select("*");
    if (category) query = query.eq("category", category);
    if (q) query = query.ilike("phrase", `%${q}%`);
    const { data } = await query.order("relevance_score", { ascending: false }).order("hit_count", { ascending: false }).limit(200);
    return NextResponse.json(data || []);
  } catch (err) {
    return errorResponse(err);
  }
}
