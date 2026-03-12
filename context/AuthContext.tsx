"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, getToken, setToken } from "@/lib/api";
import { TOKEN_KEY } from "@/lib/constants";

export interface User {
  id: number;
  email: string;
  role: "user" | "admin" | "owner";
  display_name?: string;
  company_name?: string;
  status?: string;
  profile_photo_url?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  isAdmin: boolean;
  isSuspended: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const t = getToken();
    if (!t) {
      setUser(null);
      setTokenState(null);
      setLoading(false);
      return;
    }
    setTokenState(t);
    try {
      const d = await api<{ user: User }>("/api/me");
      setUser(d.user);
    } catch {
      setUser(null);
      setToken(null);
      setTokenState(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Handle Supabase email confirmation callback
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const accessToken = params.get("access_token");
        if (accessToken) {
          setToken(accessToken);
          setTokenState(accessToken);
          history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }
    }
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const d = await api<{ token: string; user: User }>("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(d.token);
    setTokenState(d.token);
    setUser(d.user);
  };

  const register = async (email: string, password: string) => {
    const d = await api<{ token: string; user: User }>("/api/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(d.token);
    setTokenState(d.token);
    setUser(d.user);
  };

  const logout = async () => {
    try {
      await api("/api/logout", { method: "POST" });
    } catch { /* ignore */ }
    setToken(null);
    setTokenState(null);
    setUser(null);
  };

  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const isSuspended = user?.status === "suspended";

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, checkAuth, isAdmin, isSuspended }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
