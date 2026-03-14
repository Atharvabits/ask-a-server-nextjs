"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
  onSuccess?: () => void;
}

export default function AuthModal({ open, onClose, initialMode = "register", onSuccess }: AuthModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await register(email.trim(), password);
      } else {
        try {
          await login(email.trim(), password);
        } catch (loginErr) {
          const status = (loginErr as { status?: number }).status;
          if (status === 401) {
            await register(email.trim(), password);
          } else {
            throw loginErr;
          }
        }
      }
      setEmail("");
      setPassword("");
      onClose();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <img src="/assets/shield-logo.svg" alt="" className="mx-auto mb-3.5 h-12 w-12 rounded-[var(--r-lg)]" />
      <h2 className="mb-1 text-center text-lg font-bold text-[var(--c-navy)]">
        {mode === "register" ? "Create Free Account" : "Welcome Back"}
      </h2>
      <p className="mb-5 text-center text-xs text-[var(--c-muted)]">
        {mode === "register"
          ? "Get instant answers about service of process law"
          : "Sign in to access your chat history"}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1 block text-[11px] font-semibold text-[var(--c-text)]">Email</label>
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] transition-colors focus:border-[var(--c-navy)] focus:shadow-[0_0_0_3px_rgba(15,43,76,0.08)] focus:outline-none"
          />
        </div>
        <div className="mb-3.5">
          <label className="mb-1 block text-[11px] font-semibold text-[var(--c-text)]">Password</label>
          <input
            type="password"
            required
            placeholder="Create a password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-[var(--r-md)] border-[1.5px] border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-2 text-[13px] transition-colors focus:border-[var(--c-navy)] focus:shadow-[0_0_0_3px_rgba(15,43,76,0.08)] focus:outline-none"
          />
        </div>

        {error && (
          <div className="mb-2.5 rounded-[var(--r-md)] bg-red-50 px-2.5 py-2 text-[11px] text-[var(--c-err)]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-1.5 rounded-[var(--r-md)] bg-[var(--c-navy)] px-3.5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[var(--c-navy-l)] disabled:opacity-50"
        >
          {loading ? <Spinner size={12} /> : null}
          <span>{mode === "register" ? "Get Answers" : "Sign In"}</span>
        </button>
      </form>

      <p className="mt-3.5 text-center text-[11px] text-[var(--c-muted)]">
        {mode === "register" ? (
          <>
            Already have an account?{" "}
            <button onClick={() => setMode("login")} className="font-semibold text-[var(--c-navy)] hover:underline">
              Sign in
            </button>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <button onClick={() => setMode("register")} className="font-semibold text-[var(--c-navy)] hover:underline">
              Create one
            </button>
          </>
        )}
      </p>
    </Modal>
  );
}
