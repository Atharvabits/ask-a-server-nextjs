import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const status = request.nextUrl.searchParams.get("status") || "";
    const q = request.nextUrl.searchParams.get("q") || "";
    let query = supabase.from("feedback").select("*");
    if (status) query = query.eq("status", status);
    if (q) query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%,user_email.ilike.%${q}%`);
    const { data } = await query.order("created_at", { ascending: false }).limit(200);
    return NextResponse.json(data || []);
  } catch (err) {
    return errorResponse(err);
  }
}
