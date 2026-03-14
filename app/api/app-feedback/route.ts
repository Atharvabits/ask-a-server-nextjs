import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireVerified, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";
import { uploadToStorage } from "@/lib/helpers";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await requireVerified(user);

    const body = await request.json();
    const { description, screenshots } = body;

    if (!description) {
      return NextResponse.json({ detail: "Description required" }, { status: 400 });
    }

    const screenshotUrls: string[] = [];
    for (const s of (screenshots || []).slice(0, 3)) {
      if (s?.data) {
        const url = await uploadToStorage(s.data, s.name || "screenshot.png", "app_feedback");
        screenshotUrls.push(url);
      }
    }

    await supabase.from("app_feedback").insert({
      user_id: user.id,
      user_email: user.email || "",
      description,
      screenshot_urls: JSON.stringify(screenshotUrls),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
