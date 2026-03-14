"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, getToken, setToken, getRefreshToken, setRefreshToken } from "@/lib/api";

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
    let t = getToken();
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
      const rt = getRefreshToken();
      if (rt) {
        try {
          const res = await fetch("/api/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: rt }),
          });
          if (res.ok) {
            const data = await res.json();
            t = data.token;
            setToken(t);
            setTokenState(t);
            if (data.refresh_token) setRefreshToken(data.refresh_token);
            const d = await api<{ user: User }>("/api/me");
            setUser(d.user);
            setLoading(false);
            return;
          }
        } catch { /* refresh failed */ }
      }
      setUser(null);
      setToken(null);
      setRefreshToken(null);
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
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.detail || "Login failed") as Error & { status: number };
      err.status = res.status;
      throw err;
    }
    setToken(data.token);
    setTokenState(data.token);
    if (data.refresh_token) setRefreshToken(data.refresh_token);
    setUser(data.user);
  };

  const register = async (email: string, password: string) => {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.detail || "Registration failed") as Error & { status: number };
      err.status = res.status;
      throw err;
    }
    setToken(data.token);
    setTokenState(data.token);
    if (data.refresh_token) setRefreshToken(data.refresh_token);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api("/api/logout", { method: "POST" });
    } catch { /* ignore */ }
    setToken(null);
    setRefreshToken(null);
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
