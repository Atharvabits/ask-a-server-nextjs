import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireVerified, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await requireVerified(user);

    const body = await request.json();
    const widgetKey = `ask_${crypto.randomBytes(8).toString("hex")}`;

    await supabase.from("widget_keys").insert({
      widget_key: widgetKey,
      user_id: user.id,
      user_email: user.email || "",
      label: body.label || "",
      accent_color: body.accent_color || "#0f2b4c",
      position: body.position || "bottom-right",
      mode: body.mode || "light",
    });

    return NextResponse.json({ ok: true, widget_key: widgetKey });
  } catch (err) {
    return errorResponse(err);
  }
}
