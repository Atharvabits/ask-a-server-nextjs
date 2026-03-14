import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { data } = await supabase
      .from("widget_keys")
      .select("id, widget_key, label, accent_color, position, mode, revoked, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    return NextResponse.json(data || []);
  } catch (err) {
    return errorResponse(err);
  }
}
