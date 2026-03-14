import { NextRequest } from "next/server";
import { supabase } from "./supabase-server";

const RATE_LIMIT_CHAT = parseInt(process.env.RATE_LIMIT_CHAT || "20", 10);
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || "3600", 10);

export function extractToken(request: NextRequest): string | null {
  const auth = request.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  const session = request.headers.get("x-session-token");
  if (session) return session;
  return request.cookies.get("session_token")?.value || null;
}

export async function getUser(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return null;
  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (error || !authUser) return null;
    const uid = authUser.id;
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .single();
    if (!profile) return null;
    if (["admin", "owner"].includes(profile.role)) {
      profile.email_verified = true;
    } else if (authUser.email_confirmed_at) {
      profile.email_verified = true;
    }
    return profile;
  } catch {
    return null;
  }
}

export async function requireUser(request: NextRequest) {
  const u = await getUser(request);
  if (!u) throw { status: 401, detail: "Not authenticated" };
  return u;
}

export async function requireAdmin(request: NextRequest) {
  const u = await requireUser(request);
  if (!["admin", "owner"].includes(u.role)) {
    throw { status: 403, detail: "Admin access required" };
  }
  return u;
}

export async function getChatCount(userId: string): Promise<number> {
  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("user_id", userId);
  if (!sessions?.length) return 0;
  const ids = sessions.map((s: { id: string }) => s.id);
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("role", "user")
    .in("chat_session_id", ids);
  return count || 0;
}

export async function requireVerified(user: Record<string, unknown>) {
  if (["admin", "owner"].includes(user.role as string)) return;
  if (user.email_verified) return;
  const count = await getChatCount(user.id as string);
  if (count >= 1) {
    throw { status: 403, detail: "verification_required" };
  }
}

export async function checkRateLimit(userId: string) {
  const cutoff = Date.now() / 1000 - RATE_LIMIT_WINDOW;
  const { count } = await supabase
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("ts", cutoff);
  if ((count || 0) >= RATE_LIMIT_CHAT) {
    throw { status: 429, detail: `Rate limit exceeded. Max ${RATE_LIMIT_CHAT} prompts per hour.` };
  }
}

export async function recordRateLimit(userId: string) {
  const now = Date.now() / 1000;
  await supabase.from("rate_limits").insert({ user_id: userId, ts: now });
  const cutoff = now - RATE_LIMIT_WINDOW * 2;
  await supabase.from("rate_limits").delete().lt("ts", cutoff);
}

export function errorResponse(err: unknown) {
  if (err && typeof err === "object" && "status" in err && "detail" in err) {
    const e = err as { status: number; detail: string };
    return Response.json({ detail: e.detail }, { status: e.status });
  }
  console.error("Unhandled error:", err);
  return Response.json({ detail: "Internal server error" }, { status: 500 });
}
