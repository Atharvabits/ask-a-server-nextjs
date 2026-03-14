import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ widgetKey: string }> }
) {
  try {
    const { widgetKey } = await params;
    const { data } = await supabase
      .from("widget_keys")
      .select("widget_key, accent_color, position, mode, revoked")
      .eq("widget_key", widgetKey);

    if (!data?.length) return NextResponse.json({ detail: "Widget key not found" }, { status: 404 });
    if (data[0].revoked) return NextResponse.json({ detail: "Widget key has been revoked" }, { status: 403 });
    return NextResponse.json(data[0]);
  } catch {
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
