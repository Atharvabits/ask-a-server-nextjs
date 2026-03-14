import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);

    const { data: laws } = await supabase
      .from("state_laws")
      .select("id, state, title, content, created_at")
      .eq("credit_user_id", user.id)
      .order("created_at", { ascending: false });

    if (!laws?.length) return NextResponse.json([]);

    const lawIds = laws.map((l) => l.id);
    const { data: feedback } = await supabase
      .from("feedback")
      .select("state_law_id, content")
      .eq("user_id", user.id)
      .in("state_law_id", lawIds);

    const fbMap: Record<string, string> = {};
    for (const f of feedback || []) {
      fbMap[f.state_law_id] = f.content;
    }

    return NextResponse.json(laws.map((l) => ({ ...l, original_feedback: fbMap[l.id] || null })));
  } catch (err) {
    return errorResponse(err);
  }
}
