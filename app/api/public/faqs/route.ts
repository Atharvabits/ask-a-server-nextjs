import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data } = await supabase
      .from("published_faqs")
      .select("id, question, answer, sort_order")
      .eq("status", "published")
      .order("sort_order")
      .order("id");
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([]);
  }
}
