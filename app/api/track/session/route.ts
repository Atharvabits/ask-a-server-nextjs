import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = body.session_id || "";
    const user = await getUser(request);
    const userId = user?.id || null;
    const ua = request.headers.get("user-agent") || "";
    const ip = request.headers.get("x-forwarded-for") || "";

    const { data: existing } = await supabase
      .from("visitor_sessions")
      .select("id")
      .eq("session_id", sessionId);

    if (existing?.length) {
      const updateData: Record<string, unknown> = { last_active: new Date().toISOString() };
      if (userId) updateData.user_id = userId;
      await supabase.from("visitor_sessions").update(updateData).eq("session_id", sessionId);
    } else {
      await supabase.from("visitor_sessions").insert({
        session_id: sessionId,
        user_id: userId,
        ip_address: ip,
        user_agent: ua,
      });
    }
  } catch { /* non-critical */ }
  return NextResponse.json({ ok: true });
}
