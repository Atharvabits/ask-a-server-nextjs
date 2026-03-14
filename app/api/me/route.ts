import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const u = await getUser(request);
    if (!u) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });

    const { data } = await supabase.from("profiles").select("status").eq("id", u.id);
    const status = data?.[0]?.status || "active";

    return NextResponse.json({
      user: {
        id: u.id,
        email: u.email,
        role: u.role || "user",
        display_name: u.display_name || "",
        email_verified: u.email_verified || false,
        status,
      },
    });
  } catch {
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
