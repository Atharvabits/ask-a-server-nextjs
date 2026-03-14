"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatMessages, { ChatMessage } from "@/components/chat/ChatMessages";
import ChatInput from "@/components/chat/ChatInput";
import AuthModal from "@/components/auth/AuthModal";
import Link from "next/link";
import {
  createSession,
  addMessage,
  StoredMessage,
} from "@/lib/chat-store";
import { getToken, api } from "@/lib/api";

export default function ChatPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center">
          <span
            className="spinner"
            style={{
              width: 24,
              height: 24,
              borderWidth: 3,
              borderTopColor: "var(--c-navy)",
            }}
          />
        </div>
      }
    >
      <ChatPage />
    </Suspense>
  );
}

function ChatPage() {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingMsg, setPendingMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const showWelcome = messages.length === 0;

  useEffect(() => {
    if (!loading && !user) {
      setSessionId(null);
      setMessages([]);
      setRefreshKey((k) => k + 1);
      setAuthOpen(true);
    } else if (user) {
      setSessionId(null);
      setMessages([]);
      setRefreshKey((k) => k + 1);
    }
  }, [loading, user]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && user && !busy) {
      router.replace("/chat", { scroll: false });
      askQuestion(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, searchParams]);

  const askQuestion = useCallback(
    async (msg: string) => {
      if (busy) return;
      setBusy(true);

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const thisRequestId = ++requestIdRef.current;

      const userMsg: ChatMessage = { role: "user", content: msg };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const session = createSession(msg);
        currentSessionId = session.id;
        setSessionId(currentSessionId);
      }

      addMessage(currentSessionId, { role: "user", content: msg });

      try {
        const token = getToken();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
          headers["X-Session-Token"] = token;
        }

        const res = await fetch("/api/chat", {
          method: "POST",
          headers,
          body: JSON.stringify({ message: msg, chat_session_id: currentSessionId }),
          signal: controller.signal,
          credentials: "include",
        });

        if (thisRequestId !== requestIdRef.current) return;

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || err.detail || "Request failed");
        }

        setIsTyping(false);

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";
        let meta: {
          chat_session_id?: string;
          directory_results?: { company_name: string; website_url: string; notes: string; logo_url: string }[];
          featured_companies?: { company_name: string; website_url: string; notes: string; logo_url: string }[];
          state_detected?: string | null;
        } = {};

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (thisRequestId !== requestIdRef.current) {
            reader.cancel();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let eventType = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              const payload = line.slice(6);
              try {
                const data = JSON.parse(payload);
                if (eventType === "meta") {
                  meta = data;
                  if (data.chat_session_id) {
                    setSessionId(data.chat_session_id);
                  }
                } else if (eventType === "token") {
                  fullText += data.text;
                  const snapshot = fullText;
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.role === "assistant") {
                      updated[updated.length - 1] = { ...last, content: snapshot };
                    }
                    return updated;
                  });
                } else if (eventType === "done") {
                  const dirResults = meta.directory_results?.map((r) => ({
                    name: r.company_name,
                    url: r.website_url,
                    city: "",
                    state: meta.state_detected || "",
                  }));
                  const featuredCos = meta.featured_companies?.map((f) => ({
                    name: f.company_name,
                    url: f.website_url,
                    state: meta.state_detected || "",
                    notes: f.notes || "",
                    logo_url: f.logo_url || "",
                  }));

                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.role === "assistant") {
                      updated[updated.length - 1] = {
                        ...last,
                        content: fullText,
                        directory_results: dirResults,
                        featured_companies: featuredCos,
                      };
                    }
                    return updated;
                  });
                }
              } catch { /* skip malformed */ }
            }
          }
        }

        const sid = meta.chat_session_id || currentSessionId;
        const storedAssistant: StoredMessage = {
          role: "assistant",
          content: fullText,
          directory_results: meta.directory_results,
          featured_companies: meta.featured_companies,
        };
        addMessage(sid, storedAssistant);
        setRefreshKey((k) => k + 1);
      } catch (err) {
        if (thisRequestId !== requestIdRef.current) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setIsTyping(false);
        if (err instanceof Error && err.message === "sign_in_required") {
          setMessages((prev) => prev.slice(0, -1));
          setAuthOpen(true);
          setPendingMsg(msg);
        } else {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant" && !last.content) {
              updated[updated.length - 1] = {
                ...last,
                content: "Something went wrong. Please try again.",
              };
            } else {
              updated.push({ role: "assistant", content: "Something went wrong. Please try again." });
            }
            return updated;
          });
        }
      }
      setBusy(false);
    },
    [busy, sessionId]
  );

  const loadSession = async (id: string) => {
    setSidebarOpen(false);
    setSessionId(id);
    setMessages([]);
    setIsTyping(true);
    try {
      const msgs = await api<{ role: string; content: string; created_at: string }[]>(
        `/api/chat-sessions/${id}`
      );
      setMessages(
        (msgs || []).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
    } catch {
      setMessages([]);
    } finally {
      setIsTyping(false);
    }
  };

  const newChat = () => {
    if (abortRef.current) abortRef.current.abort();
    requestIdRef.current++;
    setSessionId(null);
    setMessages([]);
    setIsTyping(false);
    setBusy(false);
    setSidebarOpen(false);
  };

  return (
    <div className="grid h-dvh overflow-hidden md:grid-cols-[260px_1fr]">
      <ChatSidebar
        activeSessionId={sessionId}
        onSelectChat={loadSession}
        onNewChat={newChat}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        refreshKey={refreshKey}
      />

      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed left-2.5 top-2.5 z-[60] flex h-9 w-9 items-center justify-center rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)] shadow-[var(--sh-sm)] md:hidden"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      <main className="flex h-dvh flex-col overflow-hidden bg-[var(--c-bg)]">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--c-divider)] bg-[var(--c-surface)] px-4 py-2">
          <span className="truncate text-[13px] font-semibold text-[var(--c-navy)]">
            Welcome to the future of Process Server Intelligence!
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[var(--c-border)] text-[var(--c-muted)] transition-all hover:border-[var(--c-navy)] hover:bg-[var(--c-surface2)] hover:text-[var(--c-text)]"
              title="Toggle light/dark mode"
            >
              {theme === "light" ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>
            <Link
              href="/"
              className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--c-border)] px-3 py-1.5 text-xs font-semibold text-[var(--c-muted)] transition-all hover:border-[var(--c-navy)] hover:bg-[var(--c-surface2)] hover:text-[var(--c-navy)]"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>

        <ChatMessages
          messages={messages}
          showWelcome={showWelcome}
          isTyping={isTyping}
          onChipClick={(text) => askQuestion(text)}
        />

        <ChatInput onSend={askQuestion} disabled={busy} />
      </main>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode="login"
        onSuccess={() => {
          if (pendingMsg) {
            askQuestion(pendingMsg);
            setPendingMsg("");
          }
        }}
      />
    </div>
  );
}
