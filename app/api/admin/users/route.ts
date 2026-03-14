import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { data } = await supabase
      .from("profiles")
      .select("id, email, role, display_name, company_name, created_at, status")
      .order("created_at", { ascending: false });
    return NextResponse.json(data || []);
  } catch (err) {
    return errorResponse(err);
  }
}
