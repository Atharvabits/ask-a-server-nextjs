import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = body.session_id || "";
    const seconds = body.seconds || 30;

    const { data: current } = await supabase
      .from("visitor_sessions")
      .select("total_seconds")
      .eq("session_id", sessionId);

    const currentTotal = current?.[0]?.total_seconds || 0;

    await supabase
      .from("visitor_sessions")
      .update({
        last_active: new Date().toISOString(),
        total_seconds: currentTotal + seconds,
      })
      .eq("session_id", sessionId);
  } catch { /* non-critical */ }
  return NextResponse.json({ ok: true });
}
