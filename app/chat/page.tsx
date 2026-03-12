"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatMessages, { ChatMessage } from "@/components/chat/ChatMessages";
import ChatInput from "@/components/chat/ChatInput";
import AuthModal from "@/components/auth/AuthModal";
import Link from "next/link";
import {
  getSessions,
  getSession,
  createSession,
  addMessage,
  StoredMessage,
} from "@/lib/chat-store";

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

  const showWelcome = messages.length === 0;

  useEffect(() => {
    if (!loading && !user) {
      setAuthOpen(true);
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

      const currentMessages = getSession(currentSessionId)?.messages ?? [];
      const history = currentMessages.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg, history }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Request failed");
        }

        const data = await res.json();

        setIsTyping(false);

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: data.response,
          directory_results: data.directory_results?.map(
            (r: { company_name: string; website_url: string; notes: string; logo_url: string }) => ({
              name: r.company_name,
              url: r.website_url,
              city: "",
              state: data.state_detected || "",
            })
          ),
          featured_companies: data.featured_companies?.map(
            (f: { company_name: string; website_url: string; notes: string; logo_url: string }) => ({
              name: f.company_name,
              url: f.website_url,
              state: data.state_detected || "",
              notes: f.notes || "",
              logo_url: f.logo_url || "",
            })
          ),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        const storedAssistant: StoredMessage = {
          role: "assistant",
          content: data.response,
          directory_results: data.directory_results,
          featured_companies: data.featured_companies,
        };
        addMessage(currentSessionId, storedAssistant);
        setRefreshKey((k) => k + 1);
      } catch (err) {
        setIsTyping(false);
        if (err instanceof Error && err.message === "sign_in_required") {
          setMessages((prev) => prev.slice(0, -1));
          setAuthOpen(true);
          setPendingMsg(msg);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "Something went wrong. Please try again.",
            },
          ]);
        }
      }
      setBusy(false);
    },
    [busy, sessionId]
  );

  const loadSession = (id: string) => {
    const session = getSession(id);
    if (session) {
      setSessionId(id);
      setMessages(
        session.messages.map((m) => ({
          role: m.role,
          content: m.content,
          directory_results: m.directory_results?.map((r) => ({
            name: r.company_name,
            url: r.website_url,
            city: "",
            state: "",
          })),
          featured_companies: m.featured_companies,
        }))
      );
    }
    setSidebarOpen(false);
  };

  const newChat = () => {
    setSessionId(null);
    setMessages([]);
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
