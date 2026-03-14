"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { api } from "@/lib/api";

interface PageData {
  title: string;
  content: string;
  contact_info?: string;
}

export default function PrivacyPage() {
  const [data, setData] = useState<PageData | null>(null);

  useEffect(() => {
    api<PageData>("/api/public/page/privacy-policy")
      .then(setData)
      .catch(() => setData({ title: "Privacy Policy", content: "<p>Privacy policy content will be available soon.</p>" }));
  }, []);

  return (
    <div>
      <Header />
      <main className="mx-auto max-w-[800px] px-5 pb-[60px] pt-10">
        <div className="text-sm leading-[1.7] text-[var(--c-text)] [&_h1]:mb-5 [&_h1]:text-2xl [&_h1]:text-[var(--c-navy)] [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:text-[var(--c-navy)] [&_h3]:mb-1.5 [&_h3]:mt-4 [&_h3]:text-[15px] [&_h3]:text-[var(--c-navy)] [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:ml-5 [&_li]:mb-1">
          <h1>{data?.title || "Privacy Policy"}</h1>
          {data ? (
            data.content ? (
              <div dangerouslySetInnerHTML={{ __html: data.content }} />
            ) : (
              <p className="text-[var(--c-muted)]">Privacy policy content will be available soon.</p>
            )
          ) : (
            <p>Loading...</p>
          )}
          {data?.contact_info && (
            <div className="mt-8 rounded-[var(--r-lg)] bg-[var(--c-surface2)] p-5">
              <h3 className="!mt-0 mb-2 text-sm text-[var(--c-navy)]">Contact Information</h3>
              <pre className="whitespace-pre-wrap font-[inherit] text-[13px] text-[var(--c-text)]">{data.contact_info}</pre>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
