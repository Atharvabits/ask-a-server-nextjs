import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await request.json();

    await supabase.from("chat_thumbs").insert({
      user_id: user.id,
      chat_session_id: body.chat_session_id || null,
      direction: body.direction || "",
      response_snippet: body.response_snippet || "",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
