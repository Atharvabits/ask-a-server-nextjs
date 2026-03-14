"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import AuthModal from "@/components/auth/AuthModal";

interface HeaderProps {
  activeNav?: string;
}

export default function Header({ activeNav }: HeaderProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const active = activeNav || pathname;

  const openLogin = () => {
    setAuthMode("login");
    setAuthOpen(true);
  };
  const openRegister = () => {
    setAuthMode("register");
    setAuthOpen(true);
  };

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b border-[var(--c-divider)] bg-[var(--c-surface)]"
        style={{ backdropFilter: "blur(12px)" }}
      >
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-2.5">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <img
              src="/assets/banner-logo.svg"
              alt="AskAServer.AI"
              style={{ height: 42, width: "auto" }}
              className="md:!h-[32px]"
            />
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/state-laws"
              className={`hidden rounded-full px-3 py-1.5 text-[13px] font-semibold transition-all sm:inline-flex ${
                active === "/state-laws"
                  ? "bg-[rgba(27,45,79,0.1)] text-[var(--c-navy)]"
                  : "text-[var(--c-navy)] hover:bg-[rgba(27,45,79,0.08)]"
              }`}
            >
              State Laws
            </Link>
            <Link
              href="/blog"
              className={`hidden rounded-full px-3 py-1.5 text-[13px] font-semibold transition-all sm:inline-flex ${
                active === "/blog"
                  ? "bg-[rgba(27,45,79,0.1)] text-[var(--c-navy)]"
                  : "text-[var(--c-navy)] hover:bg-[rgba(27,45,79,0.08)]"
              }`}
            >
              Blog
            </Link>

            <button
              onClick={toggleTheme}
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[var(--c-border)] text-[var(--c-muted)] transition-all hover:border-[var(--c-navy)] hover:bg-[var(--c-surface2)] hover:text-[var(--c-text)]"
              title="Toggle light/dark mode"
            >
              {theme === "light" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>

            {user ? (
              <span className="flex items-center gap-3">
                <Link
                  href="/chat"
                  className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-[var(--c-navy)] hover:bg-[rgba(27,45,79,0.08)]"
                >
                  Back to Chat Portal
                </Link>
                <span className="max-w-[180px] truncate rounded-full bg-[var(--c-surface2)] px-3 py-1 text-xs font-medium text-[var(--c-navy)]">
                  {user.display_name || user.email}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <button
                  onClick={openLogin}
                  className="rounded-[var(--r-md)] px-3.5 py-[7px] text-[13px] font-medium text-[var(--c-muted)] transition-colors hover:bg-[var(--c-surface2)] hover:text-[var(--c-text)]"
                >
                  Sign In
                </button>
                <button
                  onClick={openRegister}
                  className="rounded-[var(--r-md)] bg-[var(--c-navy)] px-3.5 py-[7px] text-[13px] font-medium text-white transition-colors hover:bg-[var(--c-navy-l)]"
                >
                  Get Started
                </button>
              </span>
            )}
          </nav>
        </div>
      </header>
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        onSuccess={() => router.push("/chat")}
      />
    </>
  );
}
