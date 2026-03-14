import { NextRequest, NextResponse } from "next/server";
import { requireUser, getChatCount, errorResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    let verified = user.email_verified || false;
    if (["admin", "owner"].includes(user.role)) verified = true;

    const chatCount = await getChatCount(user.id);

    return NextResponse.json({
      email_verified: verified,
      chat_count: chatCount,
      needs_verification: !verified && chatCount >= 1,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
