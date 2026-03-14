import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    await requireAdmin(request);
    const { resultId } = await params;
    await supabase.from("archived_scan_results").delete().eq("id", resultId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
