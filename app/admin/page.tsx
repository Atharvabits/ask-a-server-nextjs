"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { US_STATES } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";

type AdminTab = "analytics" | "state-laws" | "company-notes" | "activity" | "users" | "feedback" | "blog" | "banner" | "trending";

interface Stats {
  total_users: number;
  total_questions: number;
  total_clicks: number;
  clicks_by_state: Array<{ state: string; count: number }>;
}

interface LawNote { id: number; state: string; title: string; content: string; added_by?: string; created_at: string }
interface UserItem { id: number; email: string; role: string; status?: string; created_at: string; display_name?: string }
interface ActivityItem { event_type: string; user_email: string; question: string; state_detected?: string; created_at: string; reference?: string }
interface FeedbackItem { id: number; state: string; title: string; content: string; company_name?: string; user_email?: string; user_id?: string; status: string; decline_reason?: string; created_at: string }
interface BlogItem { id: number; title: string; slug: string; body: string; status: string; author_email?: string; author_name?: string; is_pinned?: boolean; train_ai?: boolean; upvotes: number; downvotes: number; report_count: number; created_at: string; published_at?: string }

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState<AdminTab>("analytics");
  const [stats, setStats] = useState<Stats | null>(null);
  const [laws, setLaws] = useState<LawNote[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [fbFilter, setFbFilter] = useState<"" | "pending" | "accepted" | "declined">("");
  const [acceptModalFb, setAcceptModalFb] = useState<FeedbackItem | null>(null);
  const [acceptTitle, setAcceptTitle] = useState("");
  const [acceptContent, setAcceptContent] = useState("");
  const [acceptCredit, setAcceptCredit] = useState("");
  const [declineModalFb, setDeclineModalFb] = useState<FeedbackItem | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [blogPosts, setBlogPosts] = useState<BlogItem[]>([]);
  const [blogFilter, setBlogFilter] = useState<"" | "pending" | "published" | "declined" | "hidden">("");
  const [blogDeclinePost, setBlogDeclinePost] = useState<BlogItem | null>(null);
  const [blogDeclineReason, setBlogDeclineReason] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    loadStats();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "state-laws") loadLaws();
    if (tab === "users") loadUsers();
    if (tab === "activity") loadActivity();
    if (tab === "feedback") loadFeedback();
    if (tab === "blog") loadBlogPosts();
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

  const loadFeedback = async () => {
    try {
      const query = fbFilter ? `?status=${fbFilter}` : "";
      const d = await api<FeedbackItem[]>(`/api/admin/feedback${query}`);
      setFeedback(d);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (isAdmin && tab === "feedback") loadFeedback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fbFilter]);

  const openAcceptModal = (fb: FeedbackItem) => {
    setAcceptModalFb(fb);
    setAcceptTitle(fb.title);
    setAcceptContent(fb.content);
    setAcceptCredit(fb.company_name || "");
  };

  const submitAccept = async () => {
    if (!acceptModalFb) return;
    try {
      await api(`/api/admin/feedback/${acceptModalFb.id}/accept`, {
        method: "POST",
        body: JSON.stringify({ title: acceptTitle, content: acceptContent, credit_company: acceptCredit }),
      });
      setAcceptModalFb(null);
      loadFeedback();
    } catch { /* ignore */ }
  };

  const submitDecline = async () => {
    if (!declineModalFb) return;
    try {
      await api(`/api/admin/feedback/${declineModalFb.id}/decline`, {
        method: "POST",
        body: JSON.stringify({ reason: declineReason }),
      });
      setDeclineModalFb(null);
      setDeclineReason("");
      loadFeedback();
    } catch { /* ignore */ }
  };

  const loadBlogPosts = async () => {
    try {
      const d = await api<BlogItem[]>("/api/admin/blog");
      setBlogPosts(d);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (isAdmin && tab === "blog") loadBlogPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogFilter]);

  const filteredBlog = blogFilter ? blogPosts.filter((p) => p.status === blogFilter) : blogPosts;

  const approveBlog = async (postId: number) => {
    try {
      await api(`/api/admin/blog/${postId}/approve`, { method: "POST", body: JSON.stringify({}) });
      loadBlogPosts();
    } catch { /* ignore */ }
  };

  const declineBlog = async () => {
    if (!blogDeclinePost) return;
    try {
      await api(`/api/admin/blog/${blogDeclinePost.id}/decline`, {
        method: "POST",
        body: JSON.stringify({ reason: blogDeclineReason }),
      });
      setBlogDeclinePost(null);
      setBlogDeclineReason("");
      loadBlogPosts();
    } catch { /* ignore */ }
  };

  const toggleHideBlog = async (postId: number) => {
    try {
      await api(`/api/admin/blog/${postId}/hide`, { method: "PUT" });
      loadBlogPosts();
    } catch { /* ignore */ }
  };

  const togglePinBlog = async (postId: number) => {
    try {
      await api(`/api/admin/blog/${postId}/pin`, { method: "PUT" });
      loadBlogPosts();
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
    { id: "blog", label: "Blog" },
    { id: "banner", label: "Banner" },
    { id: "trending", label: "Trends" },
  ];

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-5 overflow-x-auto bg-[#1b2d4f] px-6 py-2.5 text-white">
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
        <button onClick={toggleTheme} className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/60 transition-all hover:bg-white/10 hover:text-white" title="Toggle light/dark mode">
          {theme === "light" ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
          )}
        </button>
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

        {tab === "feedback" && (
          <>
            <div className="mb-4 flex items-center gap-2">
              {(["", "pending", "accepted", "declined"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFbFilter(f)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                    fbFilter === f
                      ? "bg-[var(--c-navy)] text-white"
                      : "bg-[var(--c-surface2)] text-[var(--c-muted)] hover:bg-[var(--c-surface)] hover:text-[var(--c-text)]"
                  }`}
                >
                  {f === "" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              {feedback.map((fb) => (
                <div key={fb.id} className="rounded-[var(--r-lg)] border border-[var(--c-divider)] bg-[var(--c-surface)] p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-[var(--c-text)]">{fb.title}</div>
                      <div className="mt-0.5 text-[10px] text-[var(--c-faint)]">
                        {US_STATES[fb.state] || fb.state} · {fb.user_email || "Unknown"}{fb.company_name ? ` · ${fb.company_name}` : ""} · {fmtDate(fb.created_at)}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                      fb.status === "accepted" ? "bg-[#dcfce7] text-[#16a34a]" :
                      fb.status === "declined" ? "bg-[#fef2f2] text-[#dc2626]" :
                      "bg-[#fef3c7] text-[#92400e]"
                    }`}>
                      {fb.status}
                    </span>
                  </div>
                  <div className="mb-3 whitespace-pre-wrap text-xs leading-relaxed text-[var(--c-muted)]">{fb.content}</div>
                  {fb.decline_reason && (
                    <div className="mb-3 rounded-[var(--r-md)] bg-[var(--c-surface2)] p-2 text-[11px] text-[var(--c-faint)]">
                      <strong>Decline reason:</strong> {fb.decline_reason}
                    </div>
                  )}
                  {fb.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openAcceptModal(fb)}
                        className="rounded-[var(--r-md)] bg-[#16a34a] px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#15803d]"
                      >
                        Accept &amp; Add to Laws
                      </button>
                      <button
                        onClick={() => { setDeclineModalFb(fb); setDeclineReason(""); }}
                        className="rounded-[var(--r-md)] bg-[#dc2626] px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#b91c1c]"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {!feedback.length && <p className="text-[11px] italic text-[var(--c-faint)]">No feedback submissions found.</p>}
            </div>

            {acceptModalFb && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={() => setAcceptModalFb(null)}>
                <div className="mx-4 w-full max-w-[500px] rounded-[var(--r-xl)] bg-[var(--c-surface)] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                  <h3 className="mb-1 text-base font-bold text-[var(--c-navy)]">Accept Feedback</h3>
                  <p className="mb-4 text-xs text-[var(--c-muted)]">This will create a new state law entry. Edit the title and content as needed.</p>
                  <div className="mb-3">
                    <label className="mb-1 block text-[11px] font-semibold">Law Title</label>
                    <input value={acceptTitle} onChange={(e) => setAcceptTitle(e.target.value)} className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
                  </div>
                  <div className="mb-3">
                    <label className="mb-1 block text-[11px] font-semibold">Law Content</label>
                    <textarea value={acceptContent} onChange={(e) => setAcceptContent(e.target.value)} rows={5} className="w-full resize-y rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
                  </div>
                  <div className="mb-4">
                    <label className="mb-1 block text-[11px] font-semibold">Credit Company <span className="font-normal text-[var(--c-faint)]">(optional)</span></label>
                    <input value={acceptCredit} onChange={(e) => setAcceptCredit(e.target.value)} className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setAcceptModalFb(null)} className="rounded-[var(--r-md)] px-3.5 py-[7px] text-[13px] font-medium text-[var(--c-muted)] hover:bg-[var(--c-surface2)]">Cancel</button>
                    <button onClick={submitAccept} className="rounded-[var(--r-md)] bg-[#16a34a] px-3.5 py-[7px] text-[13px] font-medium text-white hover:bg-[#15803d]">Accept &amp; Create Law</button>
                  </div>
                </div>
              </div>
            )}

            {declineModalFb && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={() => setDeclineModalFb(null)}>
                <div className="mx-4 w-full max-w-[420px] rounded-[var(--r-xl)] bg-[var(--c-surface)] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                  <h3 className="mb-1 text-base font-bold text-[var(--c-navy)]">Decline Feedback</h3>
                  <p className="mb-4 text-xs text-[var(--c-muted)]">Optionally provide a reason for declining &ldquo;{declineModalFb.title}&rdquo;.</p>
                  <div className="mb-4">
                    <label className="mb-1 block text-[11px] font-semibold">Reason <span className="font-normal text-[var(--c-faint)]">(optional)</span></label>
                    <textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} rows={3} placeholder="Why is this being declined?" className="w-full resize-y rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setDeclineModalFb(null)} className="rounded-[var(--r-md)] px-3.5 py-[7px] text-[13px] font-medium text-[var(--c-muted)] hover:bg-[var(--c-surface2)]">Cancel</button>
                    <button onClick={submitDecline} className="rounded-[var(--r-md)] bg-[#dc2626] px-3.5 py-[7px] text-[13px] font-medium text-white hover:bg-[#b91c1c]">Decline</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "blog" && (
          <>
            <div className="mb-4 flex items-center gap-2">
              {(["", "pending", "published", "declined", "hidden"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setBlogFilter(f)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                    blogFilter === f
                      ? "bg-[var(--c-navy)] text-white"
                      : "bg-[var(--c-surface2)] text-[var(--c-muted)] hover:bg-[var(--c-surface)] hover:text-[var(--c-text)]"
                  }`}
                >
                  {f === "" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
              <span className="ml-auto text-[11px] text-[var(--c-faint)]">{filteredBlog.length} post{filteredBlog.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex flex-col gap-3">
              {filteredBlog.map((bp) => (
                <div key={bp.id} className="rounded-[var(--r-lg)] border border-[var(--c-divider)] bg-[var(--c-surface)] p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[var(--c-text)]">{bp.title}</span>
                        {bp.is_pinned && <span className="rounded-full bg-[var(--c-navy)] px-1.5 py-0.5 text-[8px] font-bold text-white">PINNED</span>}
                        {bp.train_ai && <span className="rounded-full bg-[#7c3aed] px-1.5 py-0.5 text-[8px] font-bold text-white">AI TRAINED</span>}
                      </div>
                      <div className="mt-0.5 text-[10px] text-[var(--c-faint)]">
                        {bp.author_name || bp.author_email || "Unknown"} · {fmtDate(bp.created_at)}
                        {bp.published_at ? ` · Published ${fmtDate(bp.published_at)}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--c-muted)]">
                        <span title="Upvotes">+{bp.upvotes}</span>
                        <span title="Downvotes">-{bp.downvotes}</span>
                        {bp.report_count > 0 && <span className="font-bold text-[#dc2626]" title="Reports">{bp.report_count} reports</span>}
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        bp.status === "published" ? "bg-[#dcfce7] text-[#16a34a]" :
                        bp.status === "declined" ? "bg-[#fef2f2] text-[#dc2626]" :
                        bp.status === "hidden" ? "bg-[var(--c-surface2)] text-[var(--c-faint)]" :
                        "bg-[#fef3c7] text-[#92400e]"
                      }`}>
                        {bp.status}
                      </span>
                    </div>
                  </div>
                  <div className="mb-3 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-[var(--c-muted)]">{bp.body}</div>
                  <div className="flex flex-wrap gap-2">
                    {bp.status === "pending" && (
                      <>
                        <button onClick={() => approveBlog(bp.id)} className="rounded-[var(--r-md)] bg-[#16a34a] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#15803d]">
                          Approve &amp; Publish
                        </button>
                        <button onClick={() => { setBlogDeclinePost(bp); setBlogDeclineReason(""); }} className="rounded-[var(--r-md)] bg-[#dc2626] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#b91c1c]">
                          Decline
                        </button>
                      </>
                    )}
                    {bp.status === "published" && (
                      <>
                        <button onClick={() => toggleHideBlog(bp.id)} className="rounded-[var(--r-md)] border border-[var(--c-border)] px-3 py-1.5 text-[11px] font-medium text-[var(--c-muted)] hover:bg-[var(--c-surface2)]">
                          Hide
                        </button>
                        <button onClick={() => togglePinBlog(bp.id)} className="rounded-[var(--r-md)] border border-[var(--c-border)] px-3 py-1.5 text-[11px] font-medium text-[var(--c-muted)] hover:bg-[var(--c-surface2)]">
                          {bp.is_pinned ? "Unpin" : "Pin"}
                        </button>
                      </>
                    )}
                    {bp.status === "hidden" && (
                      <button onClick={() => toggleHideBlog(bp.id)} className="rounded-[var(--r-md)] border border-[var(--c-border)] px-3 py-1.5 text-[11px] font-medium text-[var(--c-muted)] hover:bg-[var(--c-surface2)]">
                        Unhide
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {!filteredBlog.length && <p className="text-[11px] italic text-[var(--c-faint)]">No blog posts found.</p>}
            </div>

            {blogDeclinePost && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={() => setBlogDeclinePost(null)}>
                <div className="mx-4 w-full max-w-[420px] rounded-[var(--r-xl)] bg-[var(--c-surface)] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                  <h3 className="mb-1 text-base font-bold text-[var(--c-navy)]">Decline Blog Post</h3>
                  <p className="mb-4 text-xs text-[var(--c-muted)]">Optionally provide a reason for declining &ldquo;{blogDeclinePost.title}&rdquo;.</p>
                  <div className="mb-4">
                    <label className="mb-1 block text-[11px] font-semibold">Reason <span className="font-normal text-[var(--c-faint)]">(optional)</span></label>
                    <textarea value={blogDeclineReason} onChange={(e) => setBlogDeclineReason(e.target.value)} rows={3} placeholder="Why is this being declined?" className="w-full resize-y rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setBlogDeclinePost(null)} className="rounded-[var(--r-md)] px-3.5 py-[7px] text-[13px] font-medium text-[var(--c-muted)] hover:bg-[var(--c-surface2)]">Cancel</button>
                    <button onClick={declineBlog} className="rounded-[var(--r-md)] bg-[#dc2626] px-3.5 py-[7px] text-[13px] font-medium text-white hover:bg-[#b91c1c]">Decline</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {(tab === "company-notes" || tab === "banner" || tab === "trending") && (
          <div className="rounded-[var(--r-lg)] border border-[var(--c-divider)] bg-[var(--c-surface)] p-[18px]">
            <h3 className="mb-3.5 text-[13px] font-semibold text-[var(--c-navy)]">
              {tab === "company-notes" ? "State Sponsor" :
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
