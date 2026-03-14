import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ faqId: string }> }
) {
  try {
    await requireAdmin(request);
    const { faqId } = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    for (const field of ["question", "answer", "status", "sort_order"]) {
      if (body[field] !== undefined) updates[field] = body[field];
    }
    if (Object.keys(updates).length) {
      updates.updated_at = new Date().toISOString();
      await supabase.from("published_faqs").update(updates).eq("id", faqId);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ faqId: string }> }
) {
  try {
    await requireAdmin(request);
    const { faqId } = await params;
    await supabase.from("published_faqs").delete().eq("id", faqId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
