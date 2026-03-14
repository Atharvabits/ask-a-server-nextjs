import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email || "").toLowerCase().trim();
    const password = body.password || "";
    const displayName = body.display_name || "";

    if (!email || !password || password.length < 6) {
      return NextResponse.json({ detail: "Email and password (min 6 chars) required" }, { status: 400 });
    }

    const { data: blocked } = await supabase.from("blocked_emails").select("id").eq("email", email);
    if (blocked?.length) {
      return NextResponse.json({ detail: "This email has been blocked" }, { status: 403 });
    }

    const { data: result, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });

    if (error) {
      const err = error.message.toLowerCase();
      if (err.includes("already registered") || err.includes("already exists") || err.includes("duplicate")) {
        return NextResponse.json({ detail: "Email already registered" }, { status: 409 });
      }
      if (err.includes("rate limit") || err.includes("429") || err.includes("too many")) {
        return NextResponse.json({ detail: "Too many signup attempts. Please wait and try again." }, { status: 429 });
      }
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    if (!result?.user) {
      return NextResponse.json({ detail: "Email already registered" }, { status: 409 });
    }

    const uid = result.user.id;

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", uid);
    if (!profileData?.length) {
      try {
        await supabase.from("profiles").insert({
          id: uid,
          email,
          role: "user",
          display_name: displayName,
        });
      } catch (insertErr: unknown) {
        const errStr = String(insertErr).toLowerCase();
        if (errStr.includes("duplicate") || errStr.includes("23505") || errStr.includes("unique")) {
          return NextResponse.json({ detail: "Email already registered" }, { status: 409 });
        }
        throw insertErr;
      }
    }

    const profile = profileData?.[0] || { id: uid, email, role: "user", display_name: displayName };

    try {
      await supabase.from("activity_log").insert({
        user_email: email,
        question: "User registered",
        event_type: "registration",
      });
    } catch { /* non-critical */ }

    const token = result.session?.access_token || "";
    const refreshToken = result.session?.refresh_token || "";

    const response = NextResponse.json({
      token,
      refresh_token: refreshToken,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role || "user",
        display_name: profile.display_name || "",
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
    console.error("Register error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
