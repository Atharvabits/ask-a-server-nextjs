import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const q = request.nextUrl.searchParams.get("q") || "";
    let query = supabase.from("widget_keys").select("*");
    if (q) query = query.or(`user_email.ilike.%${q}%,label.ilike.%${q}%,widget_key.ilike.%${q}%`);
    const { data: rows } = await query.order("created_at", { ascending: false });

    const userIds = [...new Set((rows || []).filter((r) => r.user_id).map((r) => r.user_id))];
    const nameMap: Record<string, string> = {};
    if (userIds.length) {
      const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
      for (const p of profiles || []) nameMap[p.id] = p.display_name;
    }

    return NextResponse.json((rows || []).map((r) => ({ ...r, display_name: nameMap[r.user_id] || null })));
  } catch (err) {
    return errorResponse(err);
  }
}
