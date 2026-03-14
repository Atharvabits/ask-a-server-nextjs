import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    const q = request.nextUrl.searchParams.get("q") || "";
    const state = request.nextUrl.searchParams.get("state") || "";

    let query = supabase
      .from("state_laws")
      .select("id, state, title, content, credit_company, credit_user_id, created_at");

    if (q) query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
    if (state) query = query.eq("state", state);

    const { data } = await query.order("state").order("id").limit(100);
    return NextResponse.json(data || []);
  } catch (err) {
    return errorResponse(err);
  }
}
