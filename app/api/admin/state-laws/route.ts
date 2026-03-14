import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const state = request.nextUrl.searchParams.get("state") || "";
    const q = request.nextUrl.searchParams.get("q") || "";

    let query = supabase.from("state_laws").select("*");
    if (state) query = query.eq("state", state);
    if (q) query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
    const { data: rows } = await query.order("state").order("id");

    const userIds = [...new Set((rows || []).filter((r) => r.credit_user_id).map((r) => r.credit_user_id))];
    const nameMap: Record<string, string> = {};
    if (userIds.length) {
      const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
      for (const p of profiles || []) nameMap[p.id] = p.display_name;
    }

    return NextResponse.json((rows || []).map((r) => ({ ...r, credit_user_name: nameMap[r.credit_user_id] || null })));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    if (!body.state || !body.title || !body.content) {
      return NextResponse.json({ detail: "Missing required fields" }, { status: 400 });
    }
    await supabase.from("state_laws").insert({ state: body.state, title: body.title, content: body.content, added_by: "admin" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
