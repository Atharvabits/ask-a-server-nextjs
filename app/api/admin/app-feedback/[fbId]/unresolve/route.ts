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
    if (!["bug", "wishlist"].includes(body.category)) {
      return NextResponse.json({ detail: "Must unresolve to bug or wishlist" }, { status: 400 });
    }
    await supabase.from("app_feedback").update({
      category: body.category, resolution_summary: "", resolved_by: "", resolved_at: null,
    }).eq("id", fbId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
