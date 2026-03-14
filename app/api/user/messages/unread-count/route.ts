import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { count } = await supabase
      .from("admin_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    return NextResponse.json({ count: count || 0 });
  } catch (err) {
    return errorResponse(err);
  }
}
