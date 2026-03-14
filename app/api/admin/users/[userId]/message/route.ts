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
    const body = await request.json();
    if (!(body.body || "").trim()) {
      return NextResponse.json({ detail: "Message body is required" }, { status: 400 });
    }

    const { data: target } = await supabase.from("profiles").select("id").eq("id", userId).single();
    if (!target) return NextResponse.json({ detail: "Not found" }, { status: 404 });

    await supabase.from("admin_messages").insert({
      user_id: userId, sender_id: admin.id,
      subject: body.subject || "", body: body.body.trim(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
