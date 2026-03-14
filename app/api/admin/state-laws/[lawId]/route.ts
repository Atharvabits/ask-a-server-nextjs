import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ lawId: string }> }
) {
  try {
    await requireAdmin(request);
    const { lawId } = await params;
    const body = await request.json();
    await supabase.from("state_laws").update({
      state: body.state || "",
      title: body.title || "",
      content: body.content || "",
    }).eq("id", lawId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lawId: string }> }
) {
  try {
    await requireAdmin(request);
    const { lawId } = await params;
    await supabase.from("state_laws").delete().eq("id", lawId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
