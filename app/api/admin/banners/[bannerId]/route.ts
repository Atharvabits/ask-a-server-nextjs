import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ bannerId: string }> }
) {
  try {
    await requireAdmin(request);
    const { bannerId } = await params;
    const body = await request.json();
    await supabase.from("banner_messages").update({
      text: body.text || "", link_url: body.link_url || "", link_text: body.link_text || "",
    }).eq("id", bannerId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bannerId: string }> }
) {
  try {
    await requireAdmin(request);
    const { bannerId } = await params;
    await supabase.from("banner_messages").delete().eq("id", bannerId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
