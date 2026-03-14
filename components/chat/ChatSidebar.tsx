"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Spinner from "@/components/ui/Spinner";

interface ApiSession {
  id: string;
  title: string;
  created_at: string;
}

interface ChatSidebarProps {
  activeSessionId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  open: boolean;
  onClose: () => void;
  refreshKey: number;
}

export default function ChatSidebar({
  activeSessionId,
  onSelectChat,
  onNewChat,
  open,
  onClose,
  refreshKey,
}: ChatSidebarProps) {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!user) { setSessions([]); return; }
    try {
      const data = await api<ApiSession[]>("/api/chat-sessions");
      setSessions(data || []);
    } catch {
      setSessions([]);
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, refreshKey]);

  const deleteSess = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api(`/api/chat-sessions/${id}`, { method: "DELETE" });
    } catch { /* best-effort */ }
    if (activeSessionId === id) onNewChat();
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    await logout();
    setLogoutLoading(false);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[65] bg-black/35 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-0 z-[70] flex w-[260px] flex-col overflow-hidden text-white transition-transform duration-300 md:relative md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "#1B2D4F" }}
      >
        <div className="flex items-center justify-center border-b border-white/10 px-4 py-[18px]">
          <img
            src="/assets/banner-logo-light.svg"
            alt="AskAServer.AI"
            style={{ height: 36, width: "auto", display: "block", maxWidth: "100%" }}
          />
        </div>

        <button
          onClick={onNewChat}
          className="mx-2.5 mt-2.5 mb-1.5 flex items-center gap-1.5 rounded-[var(--r-md)] border border-dashed border-white/25 bg-white/10 px-2.5 py-2 text-[13px] font-medium text-white transition-all hover:border-white/40 hover:bg-white/15"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Chat
        </button>

        <Link
          href="/state-laws"
          className="mx-2.5 mb-2 flex items-center gap-1.5 rounded-[var(--r-md)] border border-white/15 bg-white/[0.07] px-2.5 py-[7px] text-xs font-medium text-white/75 transition-all hover:border-white/30 hover:bg-white/[0.14] hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          Search Law Library
        </Link>

        <div className="flex-1 overflow-y-auto px-2.5 py-1.5 [&::-webkit-scrollbar-thumb]:rounded-sm [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar]:w-[3px]">
          {sessions.length ? (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectChat(s.id)}
                className={`group mb-px flex w-full items-center justify-between rounded-[var(--r-md)] px-2.5 py-[7px] text-left text-[11px] transition-all ${
                  s.id === activeSessionId
                    ? "bg-white/[0.14] text-white"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="flex-1 truncate">{s.title}</span>
                <span
                  onClick={(e) => deleteSess(s.id, e)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--r-sm)] text-xs text-white/40 hover:bg-white/15 hover:text-white ${
                    s.id === activeSessionId ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  &times;
                </span>
              </button>
            ))
          ) : (
            <p className="px-1.5 text-[11px] text-white/35">
              No conversations yet
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 border-t border-white/10 px-2.5 py-2.5">
          <Link
            href="/settings?tab=my-feedback"
            className="flex w-full items-center justify-between gap-2 rounded-[var(--r-md)] px-3 py-2 text-left text-[12px] font-bold tracking-[0.01em] transition-all"
            style={{ background: "#B3D4FC", color: "#0A1628" }}
          >
            <span>Give Us Your Feedback</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.85, flexShrink: 0 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M8 10h0M12 10h0M16 10h0" />
            </svg>
          </Link>

          <div className="flex flex-col gap-px">
            <Link
              href="/settings"
              className="flex w-full items-center gap-2 rounded-[var(--r-md)] px-2 py-1.5 text-left text-[11px] font-medium text-white/55 transition-all hover:bg-white/10 hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, opacity: 0.7 }}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </Link>

            {user && (user.role === "admin" || user.role === "owner") && (
              <Link
                href="/admin"
                className="flex w-full items-center gap-2 rounded-[var(--r-md)] px-2 py-1.5 text-left text-[11px] font-medium text-white/55 transition-all hover:bg-white/10 hover:text-white"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, opacity: 0.7 }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
                Admin Dashboard
              </Link>
            )}
          </div>

          {user && (
            <button
              onClick={handleLogout}
              className="mt-0.5 flex w-full items-center gap-1.5 border-t border-white/[0.08] px-2 pt-2 text-left text-[11px] font-medium text-white/70 transition-all hover:text-white"
            >
              {logoutLoading ? (
                <Spinner size={12} />
              ) : (
                <>
                  <span>Logout</span>
                  <span className="max-w-[140px] truncate text-[11px] text-white/50">
                    {user.email}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: "auto", flexShrink: 0, color: "rgba(255,255,255,0.4)" }}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
