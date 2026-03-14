import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const state = request.nextUrl.searchParams.get("state") || "";
    let query = supabase
      .from("state_laws")
      .select("id, state, title, content, credit_company, credit_user_id, created_at");

    if (state) {
      query = query.eq("state", state).order("id");
    } else {
      query = query.order("state").order("id");
    }

    const { data: rows } = await query;
    const data = rows || [];

    const userIds = [...new Set(data.filter((r) => r.credit_user_id).map((r) => r.credit_user_id))];
    const nameMap: Record<string, string> = {};
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);
      for (const p of profiles || []) {
        nameMap[p.id] = p.display_name;
      }
    }

    return NextResponse.json(
      data.map((r) => ({ ...r, credit_user_name: nameMap[r.credit_user_id] || null }))
    );
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
