import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { data } = await supabase.from("site_pages").select("*").order("id");
    return NextResponse.json(data || []);
  } catch (err) {
    return errorResponse(err);
  }
}
