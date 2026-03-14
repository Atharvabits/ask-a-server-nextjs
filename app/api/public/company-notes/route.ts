import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const state = request.nextUrl.searchParams.get("state") || "";
    const fields = "id, state, company_name, website_url, notes, logo_url, created_at";

    if (state) {
      const { data: stateRows } = await supabase
        .from("company_notes")
        .select(fields)
        .eq("state", state);
      const { data: nwRows } = await supabase
        .from("company_notes")
        .select(fields)
        .eq("state", "NW");
      const rows = [
        ...((stateRows || []).sort((a, b) => a.id - b.id)),
        ...((nwRows || []).sort((a, b) => a.id - b.id)),
      ];
      return NextResponse.json(rows);
    }

    const { data } = await supabase
      .from("company_notes")
      .select(fields)
      .order("state")
      .order("id");
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
