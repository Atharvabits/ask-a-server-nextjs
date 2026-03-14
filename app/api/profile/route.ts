import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth";
import { supabase } from "@/lib/supabase-server";
import { uploadToStorage } from "@/lib/helpers";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { data } = await supabase
      .from("profiles")
      .select("id, email, role, display_name, company_name, phone, address, company_description, profile_photo_url, address_street, address_city, address_state, address_zip, website_url, profile_visibility")
      .eq("id", user.id);
    if (!data?.length) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    return NextResponse.json(data[0]);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    for (const field of [
      "display_name", "company_name", "phone", "address_street",
      "address_city", "address_state", "address_zip",
      "company_description", "website_url", "profile_visibility",
    ]) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    if (body.photo_data && body.photo_filename) {
      updates.profile_photo_url = await uploadToStorage(body.photo_data, body.photo_filename, "profiles");
    }

    if (Object.keys(updates).length) {
      await supabase.from("profiles").update(updates).eq("id", user.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
