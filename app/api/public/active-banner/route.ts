import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data } = await supabase
      .from("banner_messages")
      .select("id, text, link_url, link_text")
      .eq("is_active", true)
      .order("id", { ascending: false })
      .limit(1);
    if (data?.length) return NextResponse.json(data[0]);
  } catch { /* ignore */ }
  return NextResponse.json({ id: null, text: "", link_url: "", link_text: "" });
}
