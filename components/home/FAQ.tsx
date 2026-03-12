"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export default function FAQ() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    api<FAQItem[]>("/api/public/faqs")
      .then(setFaqs)
      .catch(() => {});
  }, []);

  if (!faqs.length) return null;

  return (
    <section className="mx-auto max-w-[960px] px-6 pb-16">
      <h2 className="mb-2 text-center text-[clamp(1.3rem,3vw,1.8rem)] font-bold text-[var(--c-navy)]">
        Frequently Asked Questions About Service of Process
      </h2>
      <p className="mx-auto mb-7 max-w-[560px] text-center text-sm leading-relaxed text-[var(--c-muted)]">
        Get answers to the most common questions from process servers and legal professionals.
      </p>
      <div className="flex flex-col">
        {faqs.map((faq, i) => (
          <div
            key={faq.id}
            className={`overflow-hidden border border-[var(--c-divider)] bg-[var(--c-surface)] ${
              i === 0 ? "rounded-t-[var(--r-lg)]" : ""
            } ${i === faqs.length - 1 ? "rounded-b-[var(--r-lg)]" : ""} ${i > 0 ? "border-t-0" : ""}`}
          >
            <button
              onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
              className="flex w-full items-center justify-between gap-3 px-[18px] py-3.5 text-left text-sm font-semibold text-[var(--c-text)] transition-colors hover:text-[var(--c-navy)]"
            >
              <span>{faq.question}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`shrink-0 text-[var(--c-faint)] transition-transform duration-250 ${
                  openId === faq.id ? "rotate-180 text-[var(--c-navy)]" : ""
                }`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{ maxHeight: openId === faq.id ? "400px" : "0" }}
            >
              <div
                className="px-[18px] pb-3.5 text-[13px] leading-[1.7] text-[var(--c-muted)]"
                dangerouslySetInnerHTML={{ __html: faq.answer }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
