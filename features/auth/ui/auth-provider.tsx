"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import { AUTH_UNAUTHORIZED_EVENT } from "@/lib/store-api-client";
import {
  clearAuthSession,
  readAuthSession,
  saveAuthSession,
  type AuthSession,
} from "@/features/auth/session";
import type { StoreManagerLoginResponse } from "@/features/auth/domain/types";

interface AuthContextValue {
  session: AuthSession | null;
  isReady: boolean;
  signIn: (login: StoreManagerLoginResponse) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  const signOut = useCallback(() => {
    clearAuthSession();
    setSession(null);
    router.replace("/login");
  }, [router]);

  const signIn = useCallback((login: StoreManagerLoginResponse) => {
    setSession(saveAuthSession(login));
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSession(readAuthSession());
      setIsReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => signOut();
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [signOut]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const remainingMilliseconds = session.expiresAt - Date.now();
    const timer = window.setTimeout(signOut, Math.max(remainingMilliseconds, 0));
    return () => window.clearTimeout(timer);
  }, [session, signOut]);

  useEffect(() => {
    if (isReady && !session && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isReady, pathname, router, session]);

  const value = useMemo(
    () => ({ session, isReady, signIn, signOut }),
    [isReady, session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
