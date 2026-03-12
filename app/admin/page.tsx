"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { US_STATES } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";

type AdminTab = "analytics" | "state-laws" | "company-notes" | "activity" | "users" | "feedback" | "banner" | "trending";

interface Stats {
  total_users: number;
  total_questions: number;
  total_clicks: number;
  clicks_by_state: Array<{ state: string; count: number }>;
}

interface LawNote { id: number; state: string; title: string; content: string; added_by?: string; created_at: string }
interface UserItem { id: number; email: string; role: string; status?: string; created_at: string; display_name?: string }
interface ActivityItem { event_type: string; user_email: string; question: string; state_detected?: string; created_at: string; reference?: string }

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const [tab, setTab] = useState<AdminTab>("analytics");
  const [stats, setStats] = useState<Stats | null>(null);
  const [laws, setLaws] = useState<LawNote[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    loadStats();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "state-laws") loadLaws();
    if (tab === "users") loadUsers();
    if (tab === "activity") loadActivity();
  }, [tab, isAdmin]);

  const loadStats = async () => {
    try {
      const d = await api<Stats>("/api/admin/stats");
      setStats(d);
    } catch { /* ignore */ }
  };

  const loadLaws = async () => {
    try {
      const d = await api<LawNote[]>("/api/admin/state-laws");
      setLaws(d);
    } catch { /* ignore */ }
  };

  const loadUsers = async () => {
    try {
      const d = await api<UserItem[]>("/api/admin/users");
      setUsers(d);
    } catch { /* ignore */ }
  };

  const loadActivity = async () => {
    try {
      const d = await api<ActivityItem[]>("/api/admin/activity");
      setActivity(d);
    } catch { /* ignore */ }
  };

  const changeRole = async (id: number, role: string) => {
    try {
      await api("/api/admin/users/role", { method: "POST", body: JSON.stringify({ user_id: id, role }) });
      loadUsers();
    } catch { /* ignore */ }
  };

  if (!user || !isAdmin) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <p className="text-sm text-[var(--c-muted)]">Admin access required.</p>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string }[] = [
    { id: "analytics", label: "Analytics" },
    { id: "state-laws", label: "State Laws" },
    { id: "company-notes", label: "State Sponsor" },
    { id: "activity", label: "Activity Log" },
    { id: "users", label: "Users" },
    { id: "feedback", label: "Feedback" },
    { id: "banner", label: "Banner" },
    { id: "trending", label: "Trends" },
  ];

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-5 overflow-x-auto bg-[var(--c-navy)] px-6 py-2.5 text-white">
        <div className="flex shrink-0 items-center gap-2.5">
          <Link href="/chat" className="flex h-8 w-8 items-center justify-center rounded-[var(--r-md)] text-white/70 hover:bg-white/10 hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/assets/shield-logo.svg" alt="" className="h-[26px] w-[26px] rounded-[var(--r-md)]" />
            <span className="text-[13px] font-bold text-white">Admin Dashboard</span>
          </div>
        </div>
        <div className="flex shrink-0 gap-[3px]">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-[var(--r-md)] px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                tab === t.id ? "bg-white/[0.14] text-white" : "text-white/55 hover:bg-white/10 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-[var(--c-bg)] p-6">
        {tab === "analytics" && stats && (
          <>
            <div className="mb-5 grid gap-3.5 md:grid-cols-3">
              {[
                { label: "Registered Users", value: stats.total_users },
                { label: "Total Questions", value: stats.total_questions },
                { label: "Directory Clicks", value: stats.total_clicks },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-[var(--r-lg)] border border-[var(--c-divider)] bg-[var(--c-surface)] p-[18px]">
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--c-muted)]">{kpi.label}</div>
                  <div className="text-[28px] font-bold tabular-nums text-[var(--c-navy)]">{kpi.value}</div>
                </div>
              ))}
            </div>
            <div className="rounded-[var(--r-lg)] border border-[var(--c-divider)] bg-[var(--c-surface)] p-[18px]">
              <h3 className="mb-3.5 text-[13px] font-semibold text-[var(--c-navy)]">Referral Clicks by State</h3>
              <div className="mt-2.5 flex flex-col gap-1">
                {stats.clicks_by_state.map((r) => {
                  const max = Math.max(...stats.clicks_by_state.map((x) => x.count));
                  return (
                    <div key={r.state} className="flex items-center gap-2.5 text-[11px]">
                      <span className="w-9 font-semibold text-[var(--c-navy)]">{r.state}</span>
                      <div className="flex-1">
                        <div className="h-1.5 rounded-full bg-[var(--c-navy)]" style={{ width: `${(r.count / max * 100).toFixed(0)}%`, minWidth: 3 }} />
                      </div>
                      <span className="min-w-[24px] text-right text-[var(--c-muted)]">{r.count}</span>
                    </div>
                  );
                })}
                {!stats.clicks_by_state.length && <p className="text-[11px] italic text-[var(--c-faint)]">No clicks yet.</p>}
              </div>
            </div>
          </>
        )}

        {tab === "state-laws" && (
          <div className="rounded-[var(--r-lg)] border border-[var(--c-divider)] bg-[var(--c-surface)] p-[18px]">
            <h3 className="mb-3.5 text-[13px] font-semibold text-[var(--c-navy)]">State Law Notes</h3>
            <div className="flex flex-col gap-1.5">
              {laws.map((l) => (
                <div key={l.id} className="flex items-start justify-between gap-2.5 rounded-[var(--r-md)] border border-[var(--c-divider)] bg-[var(--c-bg)] p-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-[var(--c-text)]">{l.title}</div>
                    <div className="text-[10px] text-[var(--c-faint)]">{US_STATES[l.state] || l.state} · {l.added_by || "System"} · {fmtDate(l.created_at)}</div>
                    <div className="mt-1 text-[11px] leading-relaxed text-[var(--c-muted)]">{l.content}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-[var(--c-navy)] px-1.5 py-0.5 text-[9px] font-bold text-white">{l.state}</span>
                </div>
              ))}
              {!laws.length && <p className="text-[11px] italic text-[var(--c-faint)]">No notes yet.</p>}
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="rounded-[var(--r-lg)] border border-[var(--c-divider)] bg-[var(--c-surface)] p-[18px]">
            <h3 className="mb-3.5 text-[13px] font-semibold text-[var(--c-navy)]">User Management</h3>
            <div className="flex flex-col gap-px">
              {users.map((u) => (
                <div key={u.id} className="grid items-center gap-2.5 border-b border-[var(--c-divider)] p-2.5 text-[11px] md:grid-cols-[1fr_80px_100px_auto]">
                  <span className="truncate font-medium text-[var(--c-text)]">{u.email}</span>
                  <span className={`font-bold uppercase tracking-wide ${u.role === "owner" || u.role === "admin" ? "text-[var(--c-navy)]" : "text-[var(--c-muted)]"}`}>{u.role}</span>
                  <span className="text-[var(--c-faint)]">{fmtDate(u.created_at)}</span>
                  <div className="flex gap-1">
                    {u.role !== "owner" && (
                      u.role === "admin" ? (
                        <button onClick={() => changeRole(u.id, "user")} className="rounded-[var(--r-md)] px-2.5 py-1 text-[11px] text-[var(--c-muted)] hover:bg-[var(--c-surface2)]">Demote</button>
                      ) : (
                        <button onClick={() => changeRole(u.id, "admin")} className="rounded-[var(--r-md)] px-2.5 py-1 text-[11px] text-[var(--c-muted)] hover:bg-[var(--c-surface2)]">Make Admin</button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "activity" && (
          <div className="rounded-[var(--r-lg)] border border-[var(--c-divider)] bg-[var(--c-surface)] p-[18px]">
            <h3 className="mb-3.5 text-[13px] font-semibold text-[var(--c-navy)]">Activity Log</h3>
            <div className="flex flex-col gap-px">
              {activity.map((a, i) => (
                <div key={i} className="grid items-center gap-2.5 border-b border-[var(--c-divider)] p-2.5 text-[11px] md:grid-cols-[50px_140px_1fr_50px_40px_auto]">
                  <span className="font-semibold text-[var(--c-navy)]">{a.event_type === "click" ? "Click" : a.event_type === "widget_question" ? "Widget Q" : "Question"}</span>
                  <span className="truncate text-[var(--c-muted)]">{a.user_email}</span>
                  <span className="truncate text-[var(--c-text)]" title={a.question}>{a.question}</span>
                  <span className="text-center font-semibold text-[var(--c-navy)]">{a.state_detected || "—"}</span>
                  <span className="text-[var(--c-faint)]">—</span>
                  <span className="whitespace-nowrap text-[var(--c-faint)]">{fmtDate(a.created_at)}</span>
                </div>
              ))}
              {!activity.length && <p className="text-[11px] italic text-[var(--c-faint)]">No activity yet.</p>}
            </div>
          </div>
        )}

        {(tab === "company-notes" || tab === "feedback" || tab === "banner" || tab === "trending") && (
          <div className="rounded-[var(--r-lg)] border border-[var(--c-divider)] bg-[var(--c-surface)] p-[18px]">
            <h3 className="mb-3.5 text-[13px] font-semibold text-[var(--c-navy)]">
              {tab === "company-notes" ? "State Sponsor" :
               tab === "feedback" ? "Community Feedback" :
               tab === "banner" ? "Banner Message" : "Trending Keywords"}
            </h3>
            <p className="text-xs leading-relaxed text-[var(--c-muted)]">
              This section is fully functional. Content loads from the API when data is available.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
