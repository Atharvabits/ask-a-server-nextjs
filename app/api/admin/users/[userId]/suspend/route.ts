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
    const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
    if (!data) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    if (data.role === "owner") return NextResponse.json({ detail: "Cannot suspend the owner" }, { status: 400 });
    await supabase.from("profiles").update({ status: "suspended" }).eq("id", userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
