import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";
import { uploadToStorage } from "@/lib/helpers";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    await requireAdmin(request);
    const { noteId } = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = {
      state: body.state || "", company_name: body.company_name || "",
      website_url: body.website_url || "", notes: body.notes || "",
    };
    if (body.logo_data && body.logo_filename) {
      updates.logo_url = await uploadToStorage(body.logo_data, body.logo_filename, "companies");
    }
    await supabase.from("company_notes").update(updates).eq("id", noteId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    await requireAdmin(request);
    const { noteId } = await params;
    await supabase.from("company_notes").delete().eq("id", noteId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
