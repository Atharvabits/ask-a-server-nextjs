import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fbId: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { fbId } = await params;
    const body = await request.json();
    if (!(body.summary || "").trim()) {
      return NextResponse.json({ detail: "Resolution summary is required" }, { status: 400 });
    }
    await supabase.from("app_feedback").update({
      category: "archived", resolution_summary: body.summary,
      resolved_by: admin.email, resolved_at: new Date().toISOString(),
    }).eq("id", fbId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
