"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { api } from "@/lib/api";
import { fmtDate } from "@/lib/utils";

interface ContributorProfile {
  display_name: string;
  company_name?: string;
  company_description?: string;
  phone?: string;
  email?: string;
  address_city?: string;
  address_state?: string;
  website_url?: string;
  profile_photo_url?: string;
  contributions: Array<{
    id: number;
    title: string;
    state: string;
    created_at: string;
  }>;
}

export default function ContributorPage() {
  const params = useParams();
  const [profile, setProfile] = useState<ContributorProfile | null>(null);

  useEffect(() => {
    if (params.id) {
      api<ContributorProfile>(`/api/public/contributor/${params.id}`)
        .then(setProfile)
        .catch(() => {});
    }
  }, [params.id]);

  if (!profile) {
    return (
      <div>
        <Header />
        <div className="flex min-h-[50vh] items-center justify-center">
          <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3, borderTopColor: "var(--c-navy)" }} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <main className="mx-auto max-w-[700px] px-6 pb-[60px] pt-10">
        <div className="rounded-[var(--r-xl)] border border-[var(--c-divider)] bg-[var(--c-surface)] p-8 shadow-[var(--sh-md)]">
          <div className="mb-6 flex items-start gap-5">
            {profile.profile_photo_url ? (
              <img src={profile.profile_photo_url} alt="" className="h-24 w-24 shrink-0 rounded-full border-[3px] border-[var(--c-border)] object-cover" />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[3px] border-[var(--c-border)] bg-[var(--c-surface2)] text-[var(--c-faint)]">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[var(--c-navy)]">{profile.display_name}</h2>
              {profile.company_name && <div className="text-sm font-semibold text-[var(--c-navy-l)]">{profile.company_name}</div>}
              {(profile.address_city || profile.address_state) && (
                <div className="mt-0.5 text-xs text-[var(--c-muted)]">
                  {[profile.address_city, profile.address_state].filter(Boolean).join(", ")}
                </div>
              )}
              {profile.company_description && (
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--c-muted)]">{profile.company_description}</p>
              )}
            </div>
          </div>

          {profile.contributions.length > 0 && (
            <div className="border-t border-[var(--c-divider)] pt-5">
              <h3 className="mb-3 text-sm font-semibold text-[var(--c-navy)]">Contributions</h3>
              <div className="flex flex-col gap-1.5">
                {profile.contributions.map((c) => (
                  <div key={c.id} className="rounded-[var(--r-md)] border border-[var(--c-divider)] bg-[var(--c-bg)] p-2.5">
                    <div className="text-xs font-semibold text-[var(--c-text)]">{c.title}</div>
                    <div className="mt-0.5 text-[10px] text-[var(--c-faint)]">{c.state} · {fmtDate(c.created_at)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
