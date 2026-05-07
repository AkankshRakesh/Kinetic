"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSession, login, logout, register } from "@/lib/auth/service";
import { clearSessionActivityLogs } from "@/lib/activity-logs";
import type { AuthSession, LoginPayload, RegisterPayload } from "@/lib/auth/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  session: AuthSession | null;
  isBusy: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function Providers({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const currentSession = await getSession();
      setSession(currentSession);
      setStatus(currentSession ? "authenticated" : "unauthenticated");
    } catch {
      setSession(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const handleLogin = useCallback(async (payload: LoginPayload) => {
    setIsBusy(true);
    try {
      const result = await login(payload);
      setSession(result.session);
      setStatus("authenticated");
    } finally {
      setIsBusy(false);
    }
  }, []);

  const handleRegister = useCallback(async (payload: RegisterPayload) => {
    setIsBusy(true);
    console.log("Attempting to register with payload:", payload);
    try {
      const result = await register(payload);
      setSession(result.session);
      setStatus("authenticated");
    } finally {
      setIsBusy(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    setIsBusy(true);
    try {
      await logout();
      setSession(null);
      setStatus("unauthenticated");
    } finally {
      setIsBusy(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      isBusy,
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout,
      refreshSession,
    }),
    [handleLogin, handleLogout, handleRegister, isBusy, refreshSession, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within Providers.");
  }

  return context;
}
