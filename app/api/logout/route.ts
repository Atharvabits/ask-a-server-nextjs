import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function POST() {
  try {
    await supabase.auth.signOut();
  } catch { /* non-fatal */ }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete("session_token");
  return response;
}
