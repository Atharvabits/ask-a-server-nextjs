import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth";
import { supabase, SUPABASE_URL } from "@/lib/supabase-server";
import crypto from "crypto";

const POSTMARK_API_KEY = process.env.POSTMARK_API_KEY || "";
const SITE_URL = process.env.SITE_URL || "";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);

    if (["admin", "owner"].includes(user.role)) {
      return NextResponse.json({ ok: true, message: "Admin accounts are pre-verified." });
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("email_verified, verification_sent_at")
      .eq("id", user.id);

    const row = profileData?.[0];
    if (row?.email_verified) {
      return NextResponse.json({ ok: true, message: "Already verified." });
    }

    if (row?.verification_sent_at) {
      const sentAt = new Date(row.verification_sent_at);
      if ((Date.now() - sentAt.getTime()) / 1000 < 60) {
        return NextResponse.json(
          { detail: "Please wait 60 seconds before requesting another verification email." },
          { status: 429 }
        );
      }
    }

    const vtoken = crypto.randomBytes(36).toString("base64url");

    await supabase
      .from("profiles")
      .update({
        verification_token: vtoken,
        verification_sent_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    const baseUrl = SITE_URL || new URL(request.url).origin;
    const verifyUrl = `${baseUrl}/api/verify-email?token=${vtoken}`;

    if (!POSTMARK_API_KEY) {
      console.log(`VERIFICATION EMAIL (sandbox mode) — To: ${user.email} Link: ${verifyUrl}`);
      return NextResponse.json({ ok: true, message: "Verification email sent." });
    }

    const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0f2b4c; font-size: 22px; margin: 0;">AskAServer.AI</h1>
        <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">Process Server Intelligence</p>
      </div>
      <div style="background: #f9fafb; border-radius: 12px; padding: 28px 24px; border: 1px solid #e5e7eb;">
        <h2 style="color: #0f2b4c; font-size: 18px; margin: 0 0 12px;">Verify Your Email</h2>
        <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
          Thanks for signing up! Click the button below to verify your email.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background: #0f2b4c; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Verify My Email</a>
        </div>
        <p style="color: #9ca3af; font-size: 11px; margin-top: 16px;">This link expires in 24 hours.</p>
      </div>
    </div>`;

    await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": POSTMARK_API_KEY,
      },
      body: JSON.stringify({
        From: "AskAServer.AI <support@mightyautomation.com>",
        To: user.email,
        Subject: "Verify your email — AskAServer.AI",
        HtmlBody: htmlBody,
        MessageStream: "outbound",
      }),
    });

    return NextResponse.json({ ok: true, message: "Verification email sent." });
  } catch (err) {
    return errorResponse(err);
  }
}
