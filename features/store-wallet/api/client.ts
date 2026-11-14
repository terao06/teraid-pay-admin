import {
  DEFAULT_CHAIN_TYPE,
  DEFAULT_CHAIN_ID,
  DEFAULT_NETWORK_NAME,
  DEFAULT_TOKEN_SYMBOL,
  TeraiD_PAY_API_BASE_URL,
} from "@/features/store-wallet/domain/config";
import {
  clearAuthSession,
  getAccessToken,
} from "@/features/store-wallet/auth/session";
import type {
  DeleteWalletSuccessResponse,
  StoreWalletSuccessResponse,
  StoreManagerLoginSuccessResponse,
  StoreWalletVerifyRequest,
  StoreWalletVerifySuccessResponse,
  WalletNonceCreateRequest,
  WalletNonceCreateSuccessResponse,
} from "@/features/store-wallet/domain/types";

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

function createStoreApiUrl(pathname: string) {
  return `${TeraiD_PAY_API_BASE_URL}${pathname}`;
}

async function readJsonOrThrow<T>(
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

function withAuthorization(init: RequestInit = {}): RequestInit {
  const accessToken = getAccessToken();
  const headers = new Headers(init.headers);

  if (!accessToken) {
    throw new Error("ログインセッションがありません。再度ログインしてください。");
  }

  headers.set("Authorization", `Bearer ${accessToken}`);
  return { ...init, headers };
}

export async function loginStoreManager(email: string, password: string) {
  return readJsonOrThrow<StoreManagerLoginSuccessResponse>(
    createStoreApiUrl("/store/manager/login"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
    false,
  );
}

export async function fetchStoreWallet(init?: RequestInit) {
  return readJsonOrThrow<StoreWalletSuccessResponse>(
    createStoreApiUrl("/store/wallet"),
    withAuthorization(init),
  );
}

export async function createWalletNonce(payload: WalletNonceCreateRequest) {
  return readJsonOrThrow<WalletNonceCreateSuccessResponse>(
    createStoreApiUrl("/store/wallet/nonce"),
    withAuthorization({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }),
  );
}

export async function verifyStoreWallet(payload: StoreWalletVerifyRequest) {
  return readJsonOrThrow<StoreWalletVerifySuccessResponse>(
    createStoreApiUrl("/store/wallet"),
    withAuthorization({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }),
  );
}

export async function deleteStoreWallet(walletId: number) {
  return readJsonOrThrow<DeleteWalletSuccessResponse>(
    createStoreApiUrl(`/store/wallet/${walletId}`),
    withAuthorization({
      method: "DELETE",
    }),
  );
}

export function getDefaultWalletProfile() {
  return {
    chainType: DEFAULT_CHAIN_TYPE,
    networkName: DEFAULT_NETWORK_NAME,
    tokenSymbol: DEFAULT_TOKEN_SYMBOL,
    chainId: DEFAULT_CHAIN_ID,
  };
}
