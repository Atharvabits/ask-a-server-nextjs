import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await requireUser(request);
    const { sessionId } = await params;

    const { data: sess } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (!sess?.length) {
      return NextResponse.json({ detail: "Session not found" }, { status: 404 });
    }

    const { data: msgs } = await supabase
      .from("messages")
      .select("role, content, created_at")
      .eq("chat_session_id", sessionId)
      .order("id");

    return NextResponse.json(msgs || []);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await requireUser(request);
    const { sessionId } = await params;

    const { data: sess } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (!sess?.length) {
      return NextResponse.json({ detail: "Session not found" }, { status: 404 });
    }

    await supabase.from("messages").delete().eq("chat_session_id", sessionId);
    await supabase.from("chat_sessions").delete().eq("id", sessionId).eq("user_id", user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
