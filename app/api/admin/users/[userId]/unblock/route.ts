import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin(request);
    const { userId } = await params;
    const { data } = await supabase.from("profiles").select("email").eq("id", userId).single();
    if (!data) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    await supabase.from("blocked_emails").delete().eq("email", data.email);
    await supabase.from("profiles").update({ status: "active" }).eq("id", userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
