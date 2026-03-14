import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const type = request.nextUrl.searchParams.get("type") || "";
    const q = request.nextUrl.searchParams.get("q") || "";
    let query = supabase.from("activity_log").select("*");
    if (type) query = query.eq("event_type", type);
    if (q) query = query.or(`question.ilike.%${q}%,user_email.ilike.%${q}%`);
    const { data } = await query.order("created_at", { ascending: false }).limit(200);
    return NextResponse.json(data || []);
  } catch (err) {
    return errorResponse(err);
  }
}
