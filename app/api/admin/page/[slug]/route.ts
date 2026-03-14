import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { slug } = await params;
    const body = await request.json();
    await supabase.from("site_pages").update({
      title: body.title || "",
      content: body.content || "",
      contact_info: body.contact_info || "",
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    }).eq("slug", slug);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
