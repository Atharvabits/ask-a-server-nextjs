import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    if (!["user", "admin", "owner"].includes(body.role)) {
      return NextResponse.json({ detail: "Invalid role" }, { status: 400 });
    }
    await supabase.from("profiles").update({ role: body.role }).eq("id", body.user_id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
