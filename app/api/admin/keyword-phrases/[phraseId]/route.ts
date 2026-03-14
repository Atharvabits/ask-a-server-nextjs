import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ phraseId: string }> }
) {
  try {
    await requireAdmin(request);
    const { phraseId } = await params;
    await supabase.from("keyword_phrases").delete().eq("id", phraseId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
