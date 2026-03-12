"use client";

import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + "px";
    }
  }, [value]);

  const handleSend = () => {
    const msg = value.trim();
    if (!msg || disabled) return;
    onSend(msg);
    setValue("");
  };

  return (
    <div className="border-t border-[var(--c-divider)] bg-[var(--c-surface)] px-3.5 pb-2.5 pt-3.5">
      <div className="mx-auto flex max-w-[760px] items-end gap-1.5 rounded-[var(--r-lg)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-3.5 py-1.5 transition-all focus-within:border-[var(--c-navy)] focus-within:shadow-[0_0_0_3px_rgba(15,43,76,0.08)]">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask any question about service of process..."
          rows={1}
          className="max-h-[100px] flex-1 resize-none border-none bg-transparent py-1 text-[13px] leading-normal placeholder:text-[var(--c-faint)] focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-[var(--c-navy)] text-white transition-colors hover:bg-[var(--c-navy-l)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {disabled ? (
            <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          )}
        </button>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-[var(--c-faint)]">
        AskAServer.AI provides educational information only — not legal advice.
      </p>
    </div>
  );
}
