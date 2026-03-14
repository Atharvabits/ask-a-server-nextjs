import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { data } = await supabase.from("banner_messages").select("*").order("created_at", { ascending: false });
    return NextResponse.json(data || []);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const text = (body.text || "").trim();
    if (!text) return NextResponse.json({ detail: "Banner text required" }, { status: 400 });
    await supabase.from("banner_messages").insert({
      text, link_url: body.link_url || "", link_text: body.link_text || "",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
