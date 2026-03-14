import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await getUser(request);
    await supabase.from("page_views").insert({
      user_id: user?.id || null,
      session_token: body.session_token || "",
      page: body.page || "",
      duration_seconds: body.duration_seconds || 0,
    });
  } catch { /* non-critical */ }
  return NextResponse.json({ ok: true });
}
