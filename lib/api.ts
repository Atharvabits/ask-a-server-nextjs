import { TOKEN_KEY } from "./constants";

function getApiBase(): string {
  if (typeof window === "undefined") return "";
  const h = window.location.hostname;
  if (h === "127.0.0.1" || h === "localhost") return "http://127.0.0.1:8000";
  return "";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(t: string | null) {
  if (typeof window === "undefined") return;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function api<T = unknown>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const base = getApiBase();
  const token = getToken();
  const extraHeaders = (opts.headers && typeof opts.headers === "object" && !Array.isArray(opts.headers))
    ? Object.fromEntries(Object.entries(opts.headers as Record<string, string>))
    : {};
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  if (token) {
    h["Authorization"] = `Bearer ${token}`;
    h["X-Session-Token"] = token;
  }
  const r = await fetch(`${base}${path}`, {
    ...opts,
    headers: h,
    credentials: "include",
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    const detail = (e as { detail?: string }).detail || "Request failed";
    if (r.status === 401) {
      setToken(null);
      throw new ApiError("sign_in_required", "sign_in_required", 401);
    }
    if (r.status === 403 && detail === "verification_required") {
      throw new ApiError(detail, "verification_required", 403);
    }
    if (r.status === 429) {
      throw new ApiError(detail, "rate_limited", 429);
    }
    throw new ApiError(detail, "error", r.status);
  }
  return r.json() as Promise<T>;
}
