export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  directory_results?: {
    company_name: string;
    website_url: string;
    notes: string;
    logo_url: string;
  }[];
  featured_companies?: {
    name: string;
    url?: string;
    state: string;
    notes: string;
    logo_url?: string;
  }[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: StoredMessage[];
  created_at: string;
}

const STORAGE_PREFIX = "askaserver_chat_sessions";

function getStorageKey(): string {
  if (typeof window === "undefined") return STORAGE_PREFIX;
  const token = localStorage.getItem("askaserver_token");
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const uid = payload.sub || payload.user_id || payload.email || "";
      if (uid) return `${STORAGE_PREFIX}_${uid}`;
    } catch { /* fall through */ }
  }
  return STORAGE_PREFIX;
}

function read(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(sessions: ChatSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(), JSON.stringify(sessions));
}

export function getSessions(): ChatSession[] {
  return read().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getSession(id: string): ChatSession | null {
  return read().find((s) => s.id === id) ?? null;
}

export function createSession(firstMessage: string): ChatSession {
  const session: ChatSession = {
    id: crypto.randomUUID(),
    title: firstMessage.slice(0, 50),
    messages: [],
    created_at: new Date().toISOString(),
  };
  const sessions = read();
  sessions.unshift(session);
  write(sessions);
  return session;
}

export function addMessage(sessionId: string, msg: StoredMessage) {
  const sessions = read();
  const session = sessions.find((s) => s.id === sessionId);
  if (session) {
    session.messages.push(msg);
    write(sessions);
  }
}

export function deleteSession(id: string) {
  const sessions = read().filter((s) => s.id !== id);
  write(sessions);
}
