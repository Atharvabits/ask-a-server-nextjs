"use client";

import { useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { mdToHtml } from "@/lib/utils";

interface DirectoryResult {
  name: string;
  url: string;
  city: string;
  state: string;
}

interface FeaturedCompany {
  name: string;
  url?: string;
  state: string;
  notes: string;
  logo_url?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  directory_results?: DirectoryResult[];
  featured_companies?: FeaturedCompany[];
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  showWelcome: boolean;
  isTyping: boolean;
  onChipClick: (text: string) => void;
}

export default function ChatMessages({ messages, showWelcome, isTyping, onChipClick }: ChatMessagesProps) {
  const { user } = useAuth();
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const copyMsg = async (text: string, btn: HTMLButtonElement) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    btn.classList.add("text-[var(--c-ok)]");
    setTimeout(() => btn.classList.remove("text-[var(--c-ok)]"), 2000);
  };

  return (
    <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 py-6 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-[var(--c-border)] [&::-webkit-scrollbar]:w-[5px]">
      {showWelcome && (
        <div className="mx-auto max-w-[560px] px-4 py-12 text-center">
          <img
            src="/assets/shield-logo.svg"
            alt=""
            style={{ width: 56, height: 56, borderRadius: "var(--r-lg)", margin: "0 auto 14px" }}
          />
          <h2 className="mb-1.5 text-lg font-bold text-[var(--c-navy)]">How can I help you today?</h2>
          <p className="mx-auto mb-5 text-[13px] text-[var(--c-muted)]">
            Ask me anything about service of process law across all 50 U.S. states.
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              "How do I serve a summons in Florida?",
              "What are the requirements to become a process server in Texas?",
              "Can I serve papers by certified mail in California?",
              "What is service by publication?",
            ].map((q) => (
              <button
                key={q}
                onClick={() => onChipClick(q)}
                className="rounded-[var(--r-lg)] border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-[7px] text-left text-[11px] text-[var(--c-muted)] transition-all hover:border-[var(--c-navy)] hover:text-[var(--c-navy)] hover:shadow-[var(--sh-sm)]"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg, i) => (
        <div
          key={i}
          className={`mx-auto mb-3.5 flex max-w-[760px] gap-2.5 ${msg.role === "user" ? "justify-end" : "flex-wrap"}`}
          style={{ animation: "fadeIn 0.3s ease-out" }}
        >
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
              msg.role === "assistant"
                ? "bg-[var(--c-navy)] text-white"
                : "order-1 bg-[var(--c-gold)] text-white"
            }`}
          >
            {msg.role === "assistant" ? (
              <img src="/assets/shield-logo.svg" alt="AI" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              user?.email?.[0]?.toUpperCase() || "U"
            )}
          </div>

          <div className={`max-w-[72%] rounded-[var(--r-lg)] px-3.5 py-2.5 text-[13px] leading-relaxed ${
            msg.role === "assistant"
              ? "border border-[var(--c-divider)] bg-[var(--c-surface)] text-[var(--c-text)]"
              : "bg-[var(--c-navy)] text-white"
          }`}>
            {msg.role === "assistant" ? (
              <>
                <div dangerouslySetInnerHTML={{ __html: mdToHtml(msg.content) }} className="[&_h3]:mb-1 [&_h3]:mt-2.5 [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3:first-child]:mt-0 [&_ul]:my-1.5 [&_ul]:pl-[18px] [&_li]:mb-[3px] [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_code]:rounded-[var(--r-sm)] [&_code]:bg-[var(--c-surface2)] [&_code]:px-1 [&_code]:text-[0.85em]" />
                <div className="mt-2.5 border-t border-[var(--c-divider)] pt-2 text-[11px] font-semibold text-[var(--c-muted)]">
                  Did this answer your question? If you need further clarification, reach out to one of our professional process servers listed below or ask another question.
                </div>
                {(msg.featured_companies?.length || msg.directory_results?.length) ? (
                  <div className="mt-2.5 flex flex-col gap-1.5">
                    {msg.featured_companies?.map((f, j) => (
                      <div key={j} className="flex items-center gap-2.5 rounded-[var(--r-md)] border border-[var(--c-gold)] bg-gradient-to-br from-[#fffbf0] to-white p-2.5 transition-all hover:shadow-[0_4px_16px_rgba(200,153,46,0.15)]">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-[var(--c-gold)] text-white">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          {f.url ? (
                            <a href={f.url} target="_blank" rel="noopener" className="block truncate text-[13px] font-semibold text-[var(--c-navy)] hover:underline">{f.name}</a>
                          ) : (
                            <span className="block truncate text-[13px] font-semibold text-[var(--c-navy)]">{f.name}</span>
                          )}
                          <div className="text-[11px] text-[var(--c-muted)]">{f.notes}</div>
                        </div>
                        <span className="shrink-0 rounded-full bg-[var(--c-gold)] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white">FEATURED</span>
                      </div>
                    ))}
                    {msg.directory_results?.length ? (
                      <>
                        <div className="mt-1 mb-1 text-[11px] font-semibold text-[var(--c-navy)]">Recommended Process Servers</div>
                        {msg.directory_results.map((r, j) => (
                          <div key={j} className="flex items-center gap-2.5 rounded-[var(--r-md)] border border-[var(--c-divider)] bg-[var(--c-bg)] p-2.5 transition-all hover:border-[var(--c-navy)] hover:shadow-[var(--sh-sm)]">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-[var(--c-navy)] text-[var(--c-gold)]">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <a href={r.url} target="_blank" rel="noopener" className="block truncate text-[13px] font-semibold text-[var(--c-navy)] hover:text-[var(--c-navy-l)] hover:underline">{r.name}</a>
                              <div className="text-[11px] text-[var(--c-muted)]">{r.city}, {r.state}</div>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : (
              msg.content
            )}
          </div>

          {msg.role === "assistant" && (
            <div className="flex w-full gap-0.5 pl-[38px]">
              <button
                onClick={(e) => {
                  const el = document.createElement("div");
                  el.innerHTML = mdToHtml(msg.content);
                  copyMsg(el.textContent || "", e.currentTarget as HTMLButtonElement);
                }}
                className="flex items-center gap-1 rounded-[var(--r-sm)] px-2 py-[3px] text-[10px] text-[var(--c-faint)] transition-all hover:bg-[var(--c-surface2)] hover:text-[var(--c-muted)]"
                title="Copy"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      ))}

      {isTyping && (
        <div className="mx-auto mb-3.5 flex max-w-[760px] gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--c-navy)] text-[10px] font-bold text-white">AI</div>
          <div className="rounded-[var(--r-lg)] border border-[var(--c-divider)] bg-[var(--c-surface)] px-3.5 py-2.5">
            <div className="typing">
              <div className="typing-d"></div>
              <div className="typing-d"></div>
              <div className="typing-d"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
