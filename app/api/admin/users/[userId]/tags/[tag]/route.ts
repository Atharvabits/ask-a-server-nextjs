import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; tag: string }> }
) {
  try {
    await requireAdmin(request);
    const { userId, tag } = await params;
    await supabase.from("user_tags").delete().eq("user_id", userId).eq("tag", tag);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
