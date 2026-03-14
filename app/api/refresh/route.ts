import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const refreshToken = body.refresh_token;

    if (!refreshToken) {
      return NextResponse.json({ detail: "Refresh token required" }, { status: 400 });
    }

    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session) {
      return NextResponse.json({ detail: "Session expired. Please sign in again." }, { status: 401 });
    }

    const token = data.session.access_token;
    const newRefreshToken = data.session.refresh_token;

    const response = NextResponse.json({
      token,
      refresh_token: newRefreshToken,
    });

    response.cookies.set("session_token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 86400 * 30,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Refresh error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
