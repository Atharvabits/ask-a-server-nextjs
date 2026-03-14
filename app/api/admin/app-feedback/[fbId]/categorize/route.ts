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
    if (!["inbox", "bug", "wishlist", "archived"].includes(body.category)) {
      return NextResponse.json({ detail: "Invalid category" }, { status: 400 });
    }
    await supabase.from("app_feedback").update({ category: body.category }).eq("id", fbId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
