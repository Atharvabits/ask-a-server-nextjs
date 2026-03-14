import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bannerId: string }> }
) {
  try {
    await requireAdmin(request);
    const { bannerId } = await params;
    await supabase.from("banner_messages").update({ is_active: false }).eq("id", bannerId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
