import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { userId } = await params;
    if (userId === admin.id) {
      return NextResponse.json({ detail: "Cannot delete yourself" }, { status: 400 });
    }
    await supabase.from("sessions").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
