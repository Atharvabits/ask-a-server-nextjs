import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { data } = await supabase
      .from("user_tags")
      .select("tag")
      .eq("user_id", userId)
      .order("created_at");
    return NextResponse.json((data || []).map((r) => r.tag));
  } catch {
    return NextResponse.json([]);
  }
}
