"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ open, onClose, children, maxWidth = "380px" }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        background: "rgba(15, 43, 76, 0.45)",
        backdropFilter: "blur(4px)",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className="relative w-full rounded-[var(--r-xl)] bg-[var(--c-surface)] p-8"
        style={{
          maxWidth,
          boxShadow: "var(--sh-lg)",
          animation: "slideUp 0.3s var(--ease)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-[var(--r-md)] text-lg text-[var(--c-faint)] hover:bg-[var(--c-surface2)] hover:text-[var(--c-text)]"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}
