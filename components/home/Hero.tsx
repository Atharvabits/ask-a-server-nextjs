"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/auth/AuthModal";

export default function Hero() {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingQuery, setPendingQuery] = useState("");

  const handleSubmit = () => {
    const q = query.trim();
    if (!q) return;
    if (!user) {
      setPendingQuery(q);
      setAuthOpen(true);
      return;
    }
    router.push(`/chat?q=${encodeURIComponent(q)}`);
  };

  const handleChip = (text: string) => {
    setQuery(text.replace(/^"|"$/g, ""));
    if (!user) {
      setPendingQuery(text.replace(/^"|"$/g, ""));
      setAuthOpen(true);
      return;
    }
    router.push(`/chat?q=${encodeURIComponent(text.replace(/^"|"$/g, ""))}`);
  };

  return (
    <>
      <main className="mx-auto max-w-[720px] px-6 pb-12 pt-16 text-center">
        <div className="mb-4 inline-block rounded-full bg-[var(--c-gold-l)] px-3 py-[3px] text-[11px] font-semibold tracking-[0.03em] text-[var(--c-navy)]">
          AI-Powered Legal Research
        </div>
        <h1 className="mb-3.5 text-[clamp(1.8rem,4vw,2.8rem)] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--c-navy)]">
          Your Expert in
          <br />
          <span className="bg-gradient-to-r from-[var(--c-gold)] to-[var(--c-gold)] bg-[length:100%_3px] bg-left-bottom bg-no-repeat pb-0.5">
            Service of Process Law
          </span>
        </h1>
        <p className="mx-auto mb-8 max-w-[500px] text-[15px] text-[var(--c-muted)]">
          Get instant, accurate answers about process serving rules, procedures, and requirements across all 50 U.S. states.
        </p>

        <div className="relative mx-auto mb-5 max-w-[560px]">
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--c-faint)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Ask any question about service of process..."
            autoComplete="off"
            className="w-full rounded-[var(--r-xl)] border-2 border-[var(--c-border)] bg-[var(--c-surface)] px-12 py-3.5 text-sm transition-colors focus:border-[var(--c-navy)] focus:shadow-[0_0_0_4px_rgba(15,43,76,0.1)] focus:outline-none"
          />
          <button
            onClick={handleSubmit}
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[var(--r-lg)] bg-[var(--c-navy)] text-white transition-colors hover:bg-[var(--c-navy-l)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="text-[11px] text-[var(--c-faint)]">Try asking:</span>
          {[
            '"How do I serve a subpoena in Texas?"',
            '"Requirements to become a process server in California"',
            '"What is substituted service in New York?"',
          ].map((q) => (
            <button
              key={q}
              onClick={() => handleChip(q)}
              className="rounded-full border border-[var(--c-border)] bg-[var(--c-surface)] px-2.5 py-1 text-[11px] text-[var(--c-muted)] transition-all hover:border-[var(--c-navy)] hover:text-[var(--c-navy)]"
            >
              {q}
            </button>
          ))}
        </div>
      </main>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode="login"
        onSuccess={() => {
          if (pendingQuery) {
            router.push(`/chat?q=${encodeURIComponent(pendingQuery)}`);
            setPendingQuery("");
          }
        }}
      />
    </>
  );
}
