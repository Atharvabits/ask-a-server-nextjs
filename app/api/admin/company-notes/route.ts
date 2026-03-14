import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";
import { uploadToStorage } from "@/lib/helpers";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const state = request.nextUrl.searchParams.get("state") || "";
    let query = supabase.from("company_notes").select("*");
    if (state) query = query.eq("state", state).order("id");
    else query = query.order("state").order("id");
    const { data } = await query;
    return NextResponse.json(data || []);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    if (!body.state || !body.company_name || !body.notes) {
      return NextResponse.json({ detail: "Missing required fields" }, { status: 400 });
    }
    let logoUrl = "";
    if (body.logo_data && body.logo_filename) {
      logoUrl = await uploadToStorage(body.logo_data, body.logo_filename, "companies");
    }
    await supabase.from("company_notes").insert({
      state: body.state, company_name: body.company_name,
      website_url: body.website_url || "", notes: body.notes, logo_url: logoUrl,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
