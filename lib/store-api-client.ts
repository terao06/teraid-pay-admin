import {
  clearAuthSession,
  getAccessToken,
} from "@/features/auth/session";

const TERAID_PAY_API_BASE_URL =
  process.env.NEXT_PUBLIC_TERAID_PAY_API_BASE_URL ?? "http://localhost:8005";

export const AUTH_UNAUTHORIZED_EVENT = "teraid-pay:auth-unauthorized";

function extractApiErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  if ("message" in payload && typeof payload.message === "string") {
    return payload.message;
  }

  if ("detail" in payload) {
    if (typeof payload.detail === "string") {
      return payload.detail;
    }

    if (
      payload.detail &&
      typeof payload.detail === "object" &&
      "message" in payload.detail &&
      typeof payload.detail.message === "string"
    ) {
      return payload.detail.message;
    }

    if (Array.isArray(payload.detail)) {
      return payload.detail
        .map((item) =>
          item && typeof item === "object" && "msg" in item ? item.msg : undefined,
        )
        .filter((message): message is string => typeof message === "string")
        .join(", ");
    }
  }

  if (
    "data" in payload &&
    payload.data &&
    typeof payload.data === "object" &&
    "message" in payload.data &&
    typeof payload.data.message === "string"
  ) {
    return payload.data.message;
  }

  return undefined;
}

function buildHttpErrorMessage(response: Response, payload: unknown, rawText: string) {
  const apiMessage = extractApiErrorMessage(payload);
  if (apiMessage) {
    return apiMessage;
  }

  const trimmedText = rawText.trim();
  if (trimmedText) {
    return trimmedText;
  }

  if (response.statusText) {
    return `${response.status} ${response.statusText}`;
  }

  return `HTTP ${response.status}`;
}

export function readClientError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function createStoreApiUrl(pathname: string) {
  return `${TERAID_PAY_API_BASE_URL}${pathname}`;
}

export async function readJsonOrThrow<T>(
  input: RequestInfo,
  init?: RequestInit,
  redirectOnUnauthorized = true,
): Promise<T> {
  const response = await fetch(input, init);
  const rawText = await response.text();
  const payload: unknown = (() => {
    if (!rawText) {
      return undefined;
    }

    try {
      return JSON.parse(rawText);
    } catch {
      return undefined;
    }
  })();

  if (!response.ok) {
    if (response.status === 401 && redirectOnUnauthorized && typeof window !== "undefined") {
      clearAuthSession();
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }
    throw new Error(buildHttpErrorMessage(response, payload, rawText));
  }

  if (payload === undefined) {
    throw new Error("API response was empty or not valid JSON.");
  }

  return payload as T;
}

export function withAuthorization(init: RequestInit = {}): RequestInit {
  const accessToken = getAccessToken();
  const headers = new Headers(init.headers);

  if (!accessToken) {
    throw new Error("ログインセッションがありません。再度ログインしてください。");
  }

  headers.set("Authorization", `Bearer ${accessToken}`);
  return { ...init, headers };
}
