import type {
  StoreManagerInfo,
  StoreManagerLoginResponse,
} from "@/features/store-wallet/domain/types";

const AUTH_SESSION_KEY = "teraid-pay-admin-session";

export interface AuthSession {
  accessToken: string;
  expiresAt: number;
  storeManager: StoreManagerInfo;
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<AuthSession>;
  return (
    typeof session.accessToken === "string" &&
    typeof session.expiresAt === "number" &&
    session.storeManager !== null &&
    typeof session.storeManager === "object" &&
    typeof session.storeManager.store_manager_id === "number" &&
    typeof session.storeManager.store_id === "number" &&
    typeof session.storeManager.name === "string" &&
    typeof session.storeManager.roll_id === "number"
  );
}

export function saveAuthSession(login: StoreManagerLoginResponse): AuthSession {
  const session: AuthSession = {
    accessToken: login.access_token,
    expiresAt: Date.now() + login.expires_in * 1000,
    storeManager: login.store_manager,
  };

  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearAuthSession() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
  }
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedSession = sessionStorage.getItem(AUTH_SESSION_KEY);
  if (!storedSession) {
    return null;
  }

  try {
    const session: unknown = JSON.parse(storedSession);
    if (!isAuthSession(session) || session.expiresAt <= Date.now()) {
      clearAuthSession();
      return null;
    }
    return session;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function getAccessToken() {
  return readAuthSession()?.accessToken ?? null;
}
