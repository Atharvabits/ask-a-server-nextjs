import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ msgId: string }> }
) {
  try {
    const user = await requireUser(request);
    const { msgId } = await params;
    await supabase.from("admin_messages").update({ is_read: true }).eq("id", msgId).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
