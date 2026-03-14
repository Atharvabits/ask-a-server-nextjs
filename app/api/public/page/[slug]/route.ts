import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { data } = await supabase
      .from("site_pages")
      .select("id, slug, title, content, contact_info, updated_at")
      .eq("slug", slug);
    if (!data?.length) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    return NextResponse.json(data[0]);
  } catch {
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
