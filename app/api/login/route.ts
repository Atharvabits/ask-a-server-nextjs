import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email || "").toLowerCase().trim();
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json({ detail: "Email and password required" }, { status: 400 });
    }

    const { data: blocked } = await supabase.from("blocked_emails").select("id").eq("email", email);
    if (blocked?.length) {
      return NextResponse.json({ detail: "This email has been blocked" }, { status: 403 });
    }

    const { data: result, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const err = error.message.toLowerCase();
      if (err.includes("email not confirmed") || err.includes("confirm")) {
        return NextResponse.json({ detail: "Please confirm your email before signing in." }, { status: 403 });
      }
      return NextResponse.json({ detail: "Invalid credentials", code: "invalid_credentials" }, { status: 401 });
    }

    if (!result?.user || !result?.session) {
      return NextResponse.json({ detail: "Invalid credentials", code: "invalid_credentials" }, { status: 401 });
    }

    const uid = result.user.id;
    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", uid);
    if (!profileData?.length) {
      return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }

    const profile = profileData[0];
    const userStatus = profile.status || "active";
    if (userStatus === "blocked") {
      return NextResponse.json({ detail: "Your account has been blocked." }, { status: 403 });
    }

    try {
      await supabase.from("activity_log").insert({
        user_email: email,
        question: "User logged in",
        event_type: "login",
      });
    } catch { /* non-critical */ }

    const token = result.session.access_token;
    const refreshToken = result.session.refresh_token;

    const response = NextResponse.json({
      token,
      refresh_token: refreshToken,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role || "user",
        display_name: profile.display_name || "",
        status: userStatus,
      },
    });

    response.cookies.set("session_token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 86400 * 30,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
