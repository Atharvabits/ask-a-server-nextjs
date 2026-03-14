import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const q = request.nextUrl.searchParams.get("q") || "";
    const { data } = await supabase
      .from("profiles")
      .select("id, email, display_name, company_name")
      .or(`email.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(10);
    return NextResponse.json(data || []);
  } catch (err) {
    return errorResponse(err);
  }
}
