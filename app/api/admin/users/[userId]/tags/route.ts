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
    const body = await request.json();
    const tag = (body.tag || "").trim();
    if (!["top_contributor", "rising_star", "goat"].includes(tag)) {
      return NextResponse.json({ detail: "Invalid tag" }, { status: 400 });
    }
    try {
      await supabase.from("user_tags").insert({ user_id: userId, tag });
    } catch { /* may be duplicate */ }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
