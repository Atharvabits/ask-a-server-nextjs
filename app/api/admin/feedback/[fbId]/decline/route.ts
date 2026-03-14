import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fbId: string }> }
) {
  try {
    await requireAdmin(request);
    const { fbId } = await params;
    const body = await request.json();
    await supabase.from("feedback").update({ status: "declined", decline_reason: body.reason || "" }).eq("id", fbId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
