"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/auth/AuthModal";

interface HeaderProps {
  activeNav?: string;
}

export default function Header({ activeNav }: HeaderProps) {
  const { user } = useAuth();
  const pathname = usePathname();
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
      />
    </>
  );
}
