"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { US_STATES } from "@/lib/constants";
import { fmtDate, fileToBase64 } from "@/lib/utils";
import Modal from "@/components/ui/Modal";

type Tab = "profile" | "my-feedback" | "my-widget" | "my-blog" | "my-messages";

export default function SettingsPageWrapper() {
  return (
    <Suspense fallback={<div className="flex h-dvh items-center justify-center"><span className="spinner" style={{ width: 24, height: 24, borderWidth: 3, borderTopColor: "var(--c-navy)" }} /></div>}>
      <SettingsPage />
    </Suspense>
  );
}

function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("profile");

  // Profile
  const [displayName, setDisplayName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateAddr, setStateAddr] = useState("");
  const [zip, setZip] = useState("");
  const [desc, setDesc] = useState("");
  const [website, setWebsite] = useState("");

  // Feedback
  const [feedbackList, setFeedbackList] = useState<Array<{ id: number; title: string; state: string; status: string; created_at: string; content: string; decline_reason?: string }>>([]);
  const [fbModalOpen, setFbModalOpen] = useState(false);
  const [fbState, setFbState] = useState("");
  const [fbTitle, setFbTitle] = useState("");
  const [fbContent, setFbContent] = useState("");
  const [fbCompany, setFbCompany] = useState("");
  const [fbError, setFbError] = useState("");

  // Widget
  const [widgetKeys, setWidgetKeys] = useState<Array<{ id: number; widget_key: string; label: string; accent_color: string; position: string; mode: string; created_at: string; revoked: boolean }>>([]);
  const [wLabel, setWLabel] = useState("");
  const [wColor, setWColor] = useState("#0f2b4c");
  const [wPos, setWPos] = useState("bottom-right");
  const [wMode, setWMode] = useState("light");

  // Blog
  const [myBlogPosts, setMyBlogPosts] = useState<Array<{ id: number; title: string; status: string; created_at: string }>>([]);
  const [blogModalOpen, setBlogModalOpen] = useState(false);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogBody, setBlogBody] = useState("");
  const [blogLink, setBlogLink] = useState("");
  const [blogErr, setBlogErr] = useState("");

  // Messages
  const [messages, setMessages] = useState<Array<{ id: number; subject: string; body: string; created_at: string; is_read: boolean; sender_email?: string }>>([]);

  useEffect(() => {
    if (!user) return;
    const t = searchParams.get("tab");
    if (t && ["profile", "my-feedback", "my-widget", "my-blog", "my-messages"].includes(t)) {
      setTab(t as Tab);
    }
    loadProfile();
  }, [user, searchParams]);

  useEffect(() => {
    if (!user) return;
    if (tab === "my-feedback") loadFeedback();
    if (tab === "my-widget") loadWidgetKeys();
    if (tab === "my-blog") loadMyBlog();
    if (tab === "my-messages") loadMessages();
  }, [tab, user]);

  const loadProfile = async () => {
    try {
      const d = await api<{ user: Record<string, string> }>("/api/me");
      setDisplayName(d.user.display_name || "");
      setCompany(d.user.company_name || "");
      setPhone(d.user.phone || "");
      setStreet(d.user.address_street || "");
      setCity(d.user.address_city || "");
      setStateAddr(d.user.address_state || "");
      setZip(d.user.address_zip || "");
      setDesc(d.user.company_description || "");
      setWebsite(d.user.website_url || "");
    } catch { /* ignore */ }
  };

  const saveProfile = async () => {
    try {
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          display_name: displayName,
          company_name: company,
          phone,
          address_street: street,
          address_city: city,
          address_state: stateAddr,
          address_zip: zip,
          company_description: desc,
          website_url: website,
        }),
      });
    } catch { /* ignore */ }
  };

  const loadFeedback = async () => {
    try {
      const d = await api<typeof feedbackList>("/api/feedback/mine");
      setFeedbackList(d);
    } catch { /* ignore */ }
  };

  const submitFeedback = async () => {
    setFbError("");
    if (!fbState || !fbTitle || !fbContent) {
      setFbError("Please fill in state, title, and feedback.");
      return;
    }
    try {
      await api("/api/feedback", {
        method: "POST",
        body: JSON.stringify({ state: fbState, title: fbTitle, content: fbContent, company_name: fbCompany }),
      });
      setFbModalOpen(false);
      loadFeedback();
    } catch (e) {
      setFbError(e instanceof Error ? e.message : "Failed to submit.");
    }
  };

  const loadWidgetKeys = async () => {
    try {
      const d = await api<typeof widgetKeys>("/api/widget/my-keys");
      setWidgetKeys(d);
    } catch { /* ignore */ }
  };

  const generateWidget = async () => {
    try {
      await api("/api/widget/generate-key", {
        method: "POST",
        body: JSON.stringify({ accent_color: wColor, position: wPos, mode: wMode, label: wLabel }),
      });
      setWLabel("");
      loadWidgetKeys();
    } catch { /* ignore */ }
  };

  const deleteWidget = async (id: number) => {
    try {
      await api(`/api/widget/keys/${id}`, { method: "DELETE" });
      loadWidgetKeys();
    } catch { /* ignore */ }
  };

  const loadMyBlog = async () => {
    try {
      const d = await api<typeof myBlogPosts>("/api/blog/my-posts");
      setMyBlogPosts(d);
    } catch { /* ignore */ }
  };

  const submitBlogPost = async () => {
    setBlogErr("");
    if (!blogTitle.trim() || !blogBody.trim()) {
      setBlogErr("Please fill in title and body.");
      return;
    }
    try {
      await api("/api/blog/submit", {
        method: "POST",
        body: JSON.stringify({ title: blogTitle, body: blogBody, link_url: blogLink }),
      });
      setBlogModalOpen(false);
      setBlogTitle("");
      setBlogBody("");
      setBlogLink("");
      loadMyBlog();
    } catch (e) {
      setBlogErr(e instanceof Error ? e.message : "Failed to submit.");
    }
  };

  const loadMessages = async () => {
    try {
      const d = await api<typeof messages>("/api/user/messages");
      setMessages(d);
    } catch { /* ignore */ }
  };

  if (!user) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <p className="text-sm text-[var(--c-muted)]">Please sign in to access settings.</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "my-feedback", label: "Feedback" },
    { id: "my-widget", label: "Website Widget" },
    { id: "my-blog", label: "Blog" },
    { id: "my-messages", label: "Messages" },
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
            <span className="text-[13px] font-bold text-white">Settings</span>
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
        {tab === "profile" && (
          <div className="rounded-[var(--r-lg)] border border-[var(--c-divider)] bg-[var(--c-surface)] p-[18px]">
            <h3 className="mb-3.5 text-[13px] font-semibold text-[var(--c-navy)]">Your Profile</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold">Display Name</label>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold">Company Name</label>
                <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your company" className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold">Email</label>
                <input value={user.email} disabled className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-surface2)] px-2.5 py-2 text-[13px] text-[var(--c-muted)]" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-[11px] font-semibold">Street Address</label>
                <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Street address" className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold">City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold">State</label>
                  <input value={stateAddr} onChange={(e) => setStateAddr(e.target.value)} placeholder="State" maxLength={2} className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold">Zip</label>
                  <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="Zip" maxLength={10} className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-[11px] font-semibold">Company Description</label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Brief description of your company..." className="w-full resize-y rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-[11px] font-semibold">Website URL</label>
                <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourwebsite.com" className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
              </div>
            </div>
            <button onClick={saveProfile} className="mt-4 rounded-[var(--r-md)] bg-[var(--c-navy)] px-3.5 py-[7px] text-[13px] font-medium text-white transition-colors hover:bg-[var(--c-navy-l)]">
              Save Profile
            </button>
          </div>
        )}

        {tab === "my-feedback" && (
          <>
            <div className="mb-3.5 rounded-[var(--r-lg)] bg-gradient-to-br from-[var(--c-navy)] to-[#1a3f6b] p-7 text-center text-white">
              <h2 className="mb-1.5 text-xl font-bold">We want to hear from you!</h2>
              <p className="mb-2.5 text-sm font-semibold text-white/85">Your Contributions Make AskAServer.ai Better.</p>
              <p className="mx-auto mb-5 max-w-[500px] text-left text-xs leading-[1.7] text-white/70">
                Submit your feedback and receive contributor credit if we implement your suggestions.
              </p>
              <button onClick={() => setFbModalOpen(true)} className="rounded-[var(--r-md)] bg-white px-6 py-2.5 text-[13px] font-semibold text-[var(--c-navy)] hover:bg-white/90">
                Submit Feedback for Review
              </button>
            </div>
            <div className="rounded-[var(--r-lg)] border border-[var(--c-divider)] bg-[var(--c-surface)] p-[18px]">
              <h3 className="mb-3.5 text-[13px] font-semibold text-[var(--c-navy)]">Your Feedback History</h3>
              <div className="flex flex-col gap-2.5">
                {feedbackList.map((fb) => (
                  <div key={fb.id} className="rounded-[var(--r-lg)] border border-[var(--c-divider)] bg-[var(--c-bg)] p-3.5">
                    <div className="mb-2 flex items-start justify-between gap-2.5">
                      <div>
                        <div className="text-[13px] font-semibold text-[var(--c-text)]">{fb.title}</div>
                        <div className="mt-0.5 text-[10px] text-[var(--c-faint)]">{US_STATES[fb.state] || fb.state} · {fmtDate(fb.created_at)}</div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide ${
                        fb.status === "accepted" ? "bg-[#dcfce7] text-[#16a34a]" :
                        fb.status === "declined" ? "bg-[#fef2f2] text-[#dc2626]" :
                        "bg-[#fef3c7] text-[#92400e]"
                      }`}>
                        {fb.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--c-muted)]">{fb.content}</div>
                    {fb.decline_reason && (
                      <div className="mt-2 rounded-[var(--r-md)] bg-[var(--c-surface2)] p-2 text-[11px] leading-relaxed text-[var(--c-faint)]">
                        <strong>Reason:</strong> {fb.decline_reason}
                      </div>
                    )}
                  </div>
                ))}
                {!feedbackList.length && (
                  <p className="text-[11px] italic text-[var(--c-faint)]">No feedback submitted yet.</p>
                )}
              </div>
            </div>
            <Modal open={fbModalOpen} onClose={() => setFbModalOpen(false)} maxWidth="480px">
              <h2 className="mb-1 text-center text-base font-bold text-[var(--c-navy)]">Submit Feedback</h2>
              <p className="mb-4 text-center text-xs text-[var(--c-muted)]">Help us improve our state law database.</p>
              <div className="mb-3.5">
                <label className="mb-1 block text-[11px] font-semibold">State</label>
                <select value={fbState} onChange={(e) => setFbState(e.target.value)} className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none">
                  <option value="">Select state...</option>
                  {Object.entries(US_STATES).sort(([,a],[,b]) => a.localeCompare(b)).map(([abbr, name]) => (
                    <option key={abbr} value={abbr}>{name} ({abbr})</option>
                  ))}
                </select>
              </div>
              <div className="mb-3.5">
                <label className="mb-1 block text-[11px] font-semibold">Title</label>
                <input value={fbTitle} onChange={(e) => setFbTitle(e.target.value)} placeholder="e.g., Personal Service Requirements Update" className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
              </div>
              <div className="mb-3.5">
                <label className="mb-1 block text-[11px] font-semibold">Your Feedback</label>
                <textarea value={fbContent} onChange={(e) => setFbContent(e.target.value)} rows={4} placeholder="Describe the law update, correction, or addition..." className="w-full resize-y rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
              </div>
              <div className="mb-3.5">
                <label className="mb-1 block text-[11px] font-semibold">Company Name <span className="font-normal text-[var(--c-faint)]">(credit attribution)</span></label>
                <input value={fbCompany} onChange={(e) => setFbCompany(e.target.value)} placeholder="e.g., 123 Legal Support" className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
              </div>
              {fbError && <div className="mb-2.5 rounded-[var(--r-md)] bg-red-50 px-2.5 py-2 text-[11px] text-[var(--c-err)]">{fbError}</div>}
              <div className="flex justify-end gap-2">
                <button onClick={() => setFbModalOpen(false)} className="rounded-[var(--r-md)] px-3.5 py-[7px] text-[13px] font-medium text-[var(--c-muted)] hover:bg-[var(--c-surface2)]">Cancel</button>
                <button onClick={submitFeedback} className="rounded-[var(--r-md)] bg-[var(--c-navy)] px-3.5 py-[7px] text-[13px] font-medium text-white hover:bg-[var(--c-navy-l)]">Submit Feedback</button>
              </div>
            </Modal>
          </>
        )}

        {tab === "my-widget" && (
          <div className="rounded-[var(--r-lg)] border border-[var(--c-divider)] bg-[var(--c-surface)] p-[18px]">
            <h3 className="mb-3.5 text-[13px] font-semibold text-[var(--c-navy)]">Website Widget</h3>
            <p className="mb-4 text-xs leading-relaxed text-[var(--c-muted)]">Generate a unique widget key and embed the AskAServer.AI chat on any website.</p>
            <div className="mb-4 rounded-[var(--r-md)] bg-[var(--c-surface2)] p-4">
              <div className="mb-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold">Label (optional)</label>
                  <input value={wLabel} onChange={(e) => setWLabel(e.target.value)} placeholder="e.g., My Company Website" className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold">Accent Color</label>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={wColor} onChange={(e) => setWColor(e.target.value)} className="h-9 w-9 cursor-pointer rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] p-0.5" />
                    <input value={wColor} onChange={(e) => setWColor(e.target.value)} maxLength={7} className="w-20 rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 font-mono text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold">Position</label>
                  <select value={wPos} onChange={(e) => setWPos(e.target.value)} className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none">
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold">Mode</label>
                  <select value={wMode} onChange={(e) => setWMode(e.target.value)} className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              </div>
              <button onClick={generateWidget} className="rounded-[var(--r-md)] bg-[var(--c-navy)] px-3.5 py-[7px] text-[13px] font-medium text-white hover:bg-[var(--c-navy-l)]">
                Generate Widget Key
              </button>
            </div>
            <div className="flex flex-col gap-3.5">
              {widgetKeys.map((k) => (
                <div key={k.id} className="rounded-[var(--r-lg)] border border-[var(--c-divider)] bg-[var(--c-bg)] p-4">
                  <div className="mb-3 flex items-start justify-between gap-2.5">
                    <div>
                      <div className="text-sm font-semibold text-[var(--c-navy)]">{k.label || "Widget Key"}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[var(--c-faint)]">
                        Created {fmtDate(k.created_at)}
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wide ${k.revoked ? "bg-[#fef2f2] text-[#dc2626]" : "bg-[#dcfce7] text-[#16a34a]"}`}>
                          {k.revoked ? "REVOKED" : "ACTIVE"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-[var(--r-sm)] border border-[var(--c-border)]" style={{ background: k.accent_color }} />
                      <span className="text-[10px] text-[var(--c-muted)]">{k.accent_color} · {k.position} · {k.mode}</span>
                    </div>
                  </div>
                  <div className="rounded-[var(--r-md)] border border-[var(--c-border)] bg-[var(--c-surface)] p-2.5">
                    <code className="block truncate text-[11px] font-mono text-[var(--c-text)]">{k.widget_key}</code>
                  </div>
                  <div className="mt-2.5 flex justify-end">
                    <button onClick={() => deleteWidget(k.id)} className="text-[11px] font-medium text-[var(--c-err)] hover:underline">× Delete Key</button>
                  </div>
                </div>
              ))}
              {!widgetKeys.length && <p className="text-[11px] italic text-[var(--c-faint)]">No widget keys yet.</p>}
            </div>
          </div>
        )}

        {tab === "my-blog" && (
          <>
            <div className="mb-5 rounded-[var(--r-lg)] bg-[var(--c-surface2)] p-6 text-center">
              <h3 className="mb-1 text-base font-bold text-[var(--c-navy)]">Become a Featured Contributor</h3>
              <p className="mx-auto mb-3 max-w-[500px] text-[13px] text-[var(--c-muted)]">Share your expertise on process serving and get recognized on our blog.</p>
              <button onClick={() => setBlogModalOpen(true)} className="rounded-[var(--r-md)] bg-[var(--c-navy)] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[var(--c-navy-l)]">
                Write a Blog Post
              </button>
            </div>
            <div className="rounded-[var(--r-lg)] border border-[var(--c-divider)] bg-[var(--c-surface)] p-[18px]">
              <h3 className="mb-3.5 text-[13px] font-semibold text-[var(--c-navy)]">My Blog Posts</h3>
              <div className="flex flex-col gap-2.5 px-4 pb-4">
                {myBlogPosts.map((bp) => (
                  <div key={bp.id} className="flex items-center justify-between gap-2.5 rounded-[var(--r-md)] border border-[var(--c-divider)] bg-[var(--c-bg)] p-3">
                    <div>
                      <div className="text-[13px] font-semibold text-[var(--c-text)]">{bp.title}</div>
                      <div className="text-[10px] text-[var(--c-faint)]">{fmtDate(bp.created_at)}</div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide ${
                      bp.status === "published" ? "bg-[#dcfce7] text-[#16a34a]" :
                      bp.status === "pending" ? "bg-[#fef3c7] text-[#92400e]" :
                      "bg-[var(--c-surface2)] text-[var(--c-faint)]"
                    }`}>
                      {bp.status.toUpperCase()}
                    </span>
                  </div>
                ))}
                {!myBlogPosts.length && <p className="text-[11px] italic text-[var(--c-faint)]">No blog posts yet.</p>}
              </div>
            </div>
            <Modal open={blogModalOpen} onClose={() => setBlogModalOpen(false)} maxWidth="560px">
              <h2 className="mb-1 text-center text-base font-bold text-[var(--c-navy)]">Write a Blog Post</h2>
              <p className="mb-4 text-center text-xs text-[var(--c-muted)]">Share your expertise. Posts are reviewed before publishing.</p>
              <div className="mb-3.5">
                <label className="mb-1 block text-[11px] font-semibold">Title</label>
                <input value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} maxLength={120} placeholder="Blog post title..." className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
              </div>
              <div className="mb-3.5">
                <label className="mb-1 block text-[11px] font-semibold">Body <span className="font-normal text-[var(--c-faint)]">({blogBody.trim().split(/\s+/).filter(Boolean).length} / 500 words)</span></label>
                <textarea value={blogBody} onChange={(e) => setBlogBody(e.target.value)} rows={8} placeholder="Write your blog post (max 500 words)..." className="min-h-[140px] w-full resize-y rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
              </div>
              <div className="mb-3.5">
                <label className="mb-1 block text-[11px] font-semibold">Related Link URL <span className="font-normal text-[var(--c-faint)]">(optional)</span></label>
                <input value={blogLink} onChange={(e) => setBlogLink(e.target.value)} placeholder="https://..." className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] focus:border-[var(--c-navy)] focus:outline-none" />
              </div>
              {blogErr && <div className="mb-2.5 rounded-[var(--r-md)] bg-red-50 px-2.5 py-2 text-[11px] text-[var(--c-err)]">{blogErr}</div>}
              <div className="flex justify-end gap-2">
                <button onClick={() => setBlogModalOpen(false)} className="rounded-[var(--r-md)] px-3.5 py-[7px] text-[13px] font-medium text-[var(--c-muted)] hover:bg-[var(--c-surface2)]">Cancel</button>
                <button onClick={submitBlogPost} className="rounded-[var(--r-md)] bg-[var(--c-navy)] px-3.5 py-[7px] text-[13px] font-medium text-white hover:bg-[var(--c-navy-l)]">Submit for Review</button>
              </div>
            </Modal>
          </>
        )}

        {tab === "my-messages" && (
          <div className="rounded-[var(--r-lg)] border border-[var(--c-divider)] bg-[var(--c-surface)] p-[18px]">
            <h3 className="mb-3.5 text-[13px] font-semibold text-[var(--c-navy)]">Messages from Admin</h3>
            <div className="flex flex-col gap-2.5 px-4 pb-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`rounded-[var(--r-lg)] border p-3.5 ${msg.is_read ? "border-[var(--c-divider)] bg-[var(--c-bg)]" : "border-[var(--c-gold-h)] bg-[var(--c-surface2)]"}`}>
                  <div className="mb-1.5 flex items-start justify-between gap-2.5">
                    <div className="text-[13px] font-semibold text-[var(--c-navy)]">{msg.subject || "No Subject"}</div>
                    <div className="text-[10px] text-[var(--c-faint)]">{fmtDate(msg.created_at)}</div>
                  </div>
                  <div className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--c-muted)]">{msg.body}</div>
                </div>
              ))}
              {!messages.length && <p className="text-[11px] italic text-[var(--c-faint)]">No messages yet.</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
