import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { userId } = await params;

    const { data } = await supabase.from("profiles").select("email, role").eq("id", userId).single();
    if (!data) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    if (data.role === "owner") return NextResponse.json({ detail: "Cannot block the owner account" }, { status: 400 });

    try {
      await supabase.from("blocked_emails").insert({ email: data.email, blocked_by: admin.email });
    } catch { /* may be duplicate */ }

    await supabase.from("profiles").update({ status: "blocked" }).eq("id", userId);
    await supabase.from("sessions").delete().eq("user_id", userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
