import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);

    const { data: msgs } = await supabase
      .from("admin_messages")
      .select("id, subject, body, is_read, created_at, sender_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!msgs?.length) return NextResponse.json([]);

    const senderIds = [...new Set(msgs.filter((m) => m.sender_id).map((m) => m.sender_id))];
    const senderMap: Record<string, string> = {};
    if (senderIds.length) {
      const { data: senders } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", senderIds);
      for (const s of senders || []) senderMap[s.id] = s.display_name;
    }

    return NextResponse.json(
      msgs.map((m) => ({ ...m, sender_name: senderMap[m.sender_id] || null }))
    );
  } catch (err) {
    return errorResponse(err);
  }
}
