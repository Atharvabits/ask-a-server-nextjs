import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

function html(content: string, status = 200) {
  return new NextResponse(content, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  if (!token) return html("<h1>Invalid link</h1>", 400);

  const { data } = await supabase
    .from("profiles")
    .select("id, email, verification_sent_at")
    .eq("verification_token", token);

  if (!data?.length) {
    return html(`<html><head><title>Verification Failed</title>
      <style>body{font-family:-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f9fafb}
      .c{text-align:center;max-width:400px;padding:32px}h1{color:#dc2626;font-size:22px}p{color:#6b7280;font-size:14px;line-height:1.6}</style></head>
      <body><div class="c"><h1>Verification Failed</h1><p>This link is invalid or has already been used.</p></div></body></html>`);
  }

  const row = data[0];

  if (row.verification_sent_at) {
    const sentAt = new Date(row.verification_sent_at);
    if ((Date.now() - sentAt.getTime()) / 1000 > 86400) {
      return html(`<html><head><title>Link Expired</title>
        <style>body{font-family:-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f9fafb}
        .c{text-align:center;max-width:400px;padding:32px}h1{color:#f59e0b;font-size:22px}p{color:#6b7280;font-size:14px;line-height:1.6}</style></head>
        <body><div class="c"><h1>Link Expired</h1><p>This verification link has expired. Please log in and request a new one.</p></div></body></html>`);
    }
  }

  await supabase
    .from("profiles")
    .update({ email_verified: true, verification_token: "" })
    .eq("id", row.id);

  try {
    await supabase.from("activity_log").insert({
      user_email: row.email,
      question: "Email verified",
      event_type: "email_verified",
    });
  } catch { /* non-critical */ }

  return html(`<html><head><title>Email Verified!</title>
    <style>body{font-family:-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f0fdf4}
    .c{text-align:center;max-width:400px;padding:32px}h1{color:#16a34a;font-size:22px}p{color:#374151;font-size:14px;line-height:1.6}
    .btn{display:inline-block;margin-top:20px;padding:12px 32px;background:#0f2b4c;color:#fff;border-radius:8px;text-decoration:none;font-weight:600}</style></head>
    <body><div class="c"><h1>&#x2705; Email Verified!</h1><p>Your email has been verified.</p>
    <a class="btn" href="/">Continue to AskAServer.AI</a></div></body></html>`);
}
