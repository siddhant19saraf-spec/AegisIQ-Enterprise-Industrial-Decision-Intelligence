"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@/types";
import { api } from "@/lib/api/client";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemo: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function decodeTokenPayload(token: string): { sub: string; role: string; exp: number } | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { sub: payload.sub, role: payload.role, exp: payload.exp };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    const payload = decodeTokenPayload(token);
    if (!payload || payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setIsLoading(false);
      return;
    }
    api.setAuthToken(token);
    setUser({
      id: payload.sub,
      email: "",
      name: "",
      role: payload.role as User["role"],
      is_active: true,
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ access_token: string; refresh_token: string }>("/api/v1/auth/login", { email, password });
    localStorage.setItem("access_token", res.access_token);
    localStorage.setItem("refresh_token", res.refresh_token);
    api.setAuthToken(res.access_token);
    const payload = decodeTokenPayload(res.access_token);
    if (!payload) throw new Error("Invalid token");
    setUser({
      id: payload.sub,
      email,
      name: "",
      role: payload.role as User["role"],
      is_active: true,
    });
  }, []);

  const loginAsDemo = useCallback(async () => {
    const res = await api.post<{ access_token: string; refresh_token: string }>("/api/v1/auth/demo");
    localStorage.setItem("access_token", res.access_token);
    localStorage.setItem("refresh_token", res.refresh_token);
    api.setAuthToken(res.access_token);
    setUser({
      id: "demo-user",
      email: "demo@aegisiq.io",
      name: "Demo User",
      role: "admin",
      is_active: true,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    api.setAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, isLoading, login, loginAsDemo, logout }),
    [user, isLoading, login, loginAsDemo, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
