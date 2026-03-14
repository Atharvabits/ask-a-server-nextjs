"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { US_STATES, getIconForLaw } from "@/lib/constants";

interface StateLaw {
  title: string;
  content: string;
  credit_company?: string;
  credit_user_id?: number;
  id?: number;
}

interface StateData {
  abbr: string;
  name: string;
  laws: StateLaw[];
}

interface CompanyNote {
  company_name: string;
  website_url?: string;
  notes: string;
  logo_url?: string;
}

export default function StateLawsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stateData, setStateData] = useState<Record<string, StateData>>({});
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [detailLaws, setDetailLaws] = useState<StateLaw[]>([]);
  const [featuredCompanies, setFeaturedCompanies] = useState<CompanyNote[]>([]);
  const [lawQuestion, setLawQuestion] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [dbCounts, setDbCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadStaticData();
  }, []);

  const loadStaticData = async () => {
    try {
      const res = await fetch("/api/public/state-laws");
      if (!res.ok) return;
      const dbLaws = (await res.json()) as { state: string; title: string; content: string; credit_company?: string; credit_user_id?: number; id?: number }[];

      const grouped: Record<string, StateData> = {};
      const counts: Record<string, number> = {};
      for (const dl of dbLaws) {
        if (!dl.state) continue;
        const abbr = dl.state.toUpperCase();
        const name = US_STATES[abbr] || abbr;
        if (!grouped[abbr]) grouped[abbr] = { abbr, name, laws: [] };
        grouped[abbr].laws.push(dl);
        counts[abbr] = (counts[abbr] || 0) + 1;
      }

      setStateData(grouped);
      setDbCounts(counts);
    } catch { /* ignore */ }
  };

  const showDetail = async (abbr: string) => {
    setSelectedState(abbr);
    const s = stateData[abbr];
    if (!s) return;

    let allLaws = [...s.laws];
    let companies: CompanyNote[] = [];

    try {
      const [dbLaws, dbCompanies] = await Promise.all([
        fetch(`/api/public/state-laws?state=${abbr}`).then((r) => (r.ok ? r.json() : [])),
        fetch(`/api/public/company-notes?state=${abbr}`).then((r) => (r.ok ? r.json() : [])),
      ]);
      const existingTitles = new Set(s.laws.map((l) => l.title.toLowerCase().trim()));
      (dbLaws as StateLaw[]).forEach((dl) => {
        const matchIdx = allLaws.findIndex((l) => l.title.toLowerCase().trim() === dl.title.toLowerCase().trim());
        if (matchIdx >= 0) {
          allLaws[matchIdx] = dl;
        } else {
          allLaws.push(dl);
        }
      });
      companies = dbCompanies as CompanyNote[];
    } catch { /* ignore */ }

    setDetailLaws(allLaws);
    setFeaturedCompanies(companies);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLawsAsk = () => {
    const q = lawQuestion.trim();
    if (!q) return;
    const stateName = selectedState && stateData[selectedState]?.name;
    const fullQ = stateName && !q.includes(stateName) ? `${q} in ${stateName}` : q;
    if (!user) {
      setAuthOpen(true);
      return;
    }
    router.push(`/chat?q=${encodeURIComponent(fullQ)}`);
  };

  const sortedStates = Object.values(stateData).sort((a, b) => a.name.localeCompare(b.name));
  const currentState = selectedState ? stateData[selectedState] : null;

  return (
    <div>
      <Header activeNav="/state-laws" />

      <main className="mx-auto max-w-[1100px] px-6 pb-[60px] pt-6">
        {!selectedState ? (
          <>
            <div className="py-10 text-center">
              <h1 className="mb-2.5 text-[clamp(1.6rem,4vw,2.2rem)] font-bold text-[var(--c-navy)]">
                Service of Process Laws by State
              </h1>
              <p className="mx-auto max-w-[600px] text-sm leading-relaxed text-[var(--c-muted)]">
                The most comprehensive guide to service of process statutes, requirements, and procedures across all 50 U.S. states and the District of Columbia. Select your state below.
              </p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(90px,1fr))] sm:gap-1.5">
              {sortedStates.map((s) => (
                <button
                  key={s.abbr}
                  onClick={() => showDetail(s.abbr)}
                  className="flex flex-col items-center gap-1 rounded-[var(--r-lg)] border border-[var(--c-border)] bg-[var(--c-surface)] px-2.5 py-4 text-center transition-all hover:-translate-y-px hover:border-[var(--c-navy)] hover:shadow-[var(--sh-md)]"
                >
                  <span className="text-xl font-bold leading-none text-[var(--c-navy)]">{s.abbr}</span>
                  <span className="text-xs font-medium leading-tight text-[var(--c-text)]">{s.name}</span>
                  <span className="text-[10px] text-[var(--c-faint)]">
                    {s.laws.length + (dbCounts[s.abbr] || 0)} Contributions
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : currentState ? (
          <>
            <button
              onClick={() => setSelectedState(null)}
              className="mb-4 inline-flex items-center gap-1 border-none bg-none py-1.5 text-[13px] font-semibold text-[var(--c-navy)] transition-colors hover:text-[var(--c-navy-l)]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              All States
            </button>

            <div className="mb-5">
              <h2 className="mb-1 text-[clamp(1.3rem,3vw,1.8rem)] font-bold text-[var(--c-navy)]">
                {currentState.name} ({currentState.abbr})
              </h2>
              <p className="text-[13px] text-[var(--c-muted)]">Service of Process Laws &amp; Requirements</p>
            </div>

            {featuredCompanies.length > 0 && (
              <div className="mb-8 rounded-[var(--r-lg)] bg-[var(--c-navy)] p-5">
                <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/55">Featured Process Servers</div>
                <div className="grid gap-2.5">
                  {featuredCompanies.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-[var(--r-lg)] border border-white/[0.12] bg-white/[0.07] px-4 py-3.5 transition-all hover:border-white/25 hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-white/10 text-white/50">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        {c.website_url ? (
                          <a href={c.website_url} target="_blank" rel="noopener" className="text-sm font-semibold text-white hover:text-[var(--c-gold-h)] hover:underline">{c.company_name}</a>
                        ) : (
                          <span className="text-sm font-semibold text-white">{c.company_name}</span>
                        )}
                        <div className="mt-0.5 text-xs leading-relaxed text-white/60">{c.notes}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8 grid gap-3">
              {detailLaws.map((l, i) => (
                <div key={i} className="rounded-[var(--r-lg)] border border-[var(--c-border)] bg-[var(--c-surface)] px-[18px] py-4 transition-colors hover:border-[var(--c-navy)]">
                  <div className="mb-2 flex items-start gap-2">
                    <span className="mt-px shrink-0 text-lg">{getIconForLaw(l.title)}</span>
                    <h3 className="text-[13px] font-semibold leading-snug text-[var(--c-navy)]">{l.title}</h3>
                  </div>
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--c-text)]">{l.content}</p>
                  {l.credit_company && (
                    <div className="mt-2 border-t border-dashed border-[var(--c-divider)] pt-1.5 text-[11px] text-[var(--c-faint)]">
                      Credit: <span className="font-semibold text-[var(--c-navy)]">{l.credit_company}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-[var(--r-xl)] bg-gradient-to-br from-[var(--c-navy)] to-[var(--c-navy-l)] p-0.5">
              <div className="rounded-[calc(var(--r-xl)-2px)] bg-[var(--c-navy-d)] px-6 py-7 text-center">
                <h3 className="mb-1.5 text-lg font-bold text-white">Have a Question About This State&apos;s Laws?</h3>
                <p className="mb-4 text-[13px] text-white/60">Get instant, AI-powered answers about service of process rules, requirements, and procedures.</p>
                <div className="mx-auto flex max-w-[520px] gap-2">
                  <input
                    type="text"
                    value={lawQuestion}
                    onChange={(e) => setLawQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLawsAsk()}
                    placeholder={`e.g., Can I serve papers on Sunday in ${currentState.name}?`}
                    autoComplete="off"
                    className="flex-1 rounded-[var(--r-md)] border border-white/15 bg-white/[0.08] px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/35 focus:border-[var(--c-gold)] focus:outline-none"
                  />
                  <button
                    onClick={handleLawsAsk}
                    className="whitespace-nowrap rounded-[var(--r-md)] bg-[var(--c-navy)] px-[18px] py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[var(--c-navy-l)]"
                  >
                    Ask Now
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </main>

      <Footer />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode="login" />
    </div>
  );
}
