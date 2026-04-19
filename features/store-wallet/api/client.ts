import {
  DEFAULT_CHAIN_TYPE,
  DEFAULT_NETWORK_NAME,
  STORE_ID,
  TERAID_PAY_API_BASE_URL,
} from "@/features/store-wallet/domain/config";
import type {
  StoreWalletSuccessResponse,
  StoreWalletResponse,
  StoreWalletVerifyRequest,
  StoreWalletVerifySuccessResponse,
  WalletNonceCreateRequest,
  WalletNonceCreateSuccessResponse,
} from "@/features/store-wallet/domain/types";

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
  return `${TERAID_PAY_API_BASE_URL}${pathname}`;
}

async function readJsonOrThrow<T>(
  input: RequestInfo,
  init?: RequestInit,
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
    throw new Error(buildHttpErrorMessage(response, payload, rawText));
  }

  if (payload === undefined) {
    throw new Error("API response was empty or not valid JSON.");
  }

  return payload as T;
}

export async function fetchStoreWallet(init?: RequestInit) {
  return readJsonOrThrow<StoreWalletSuccessResponse>(
    createStoreApiUrl(`/store/${STORE_ID}/wallet`),
    init,
  );
}

export async function createWalletNonce(payload: WalletNonceCreateRequest) {
  return readJsonOrThrow<WalletNonceCreateSuccessResponse>(
    createStoreApiUrl(`/store/${STORE_ID}/wallet/nonce`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function verifyStoreWallet(payload: StoreWalletVerifyRequest) {
  return readJsonOrThrow<StoreWalletVerifySuccessResponse>(
    createStoreApiUrl(`/store/${STORE_ID}/wallet`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function getInitialWallet(): Promise<{
  initialWallet: StoreWalletResponse | null;
  initialError?: string;
}> {
  try {
    const result = await fetchStoreWallet({
      cache: "no-store",
    });

    return {
      initialWallet: result.data,
    };
  } catch (error) {
    return {
      initialWallet: null,
      initialError: readClientError(
        error,
        "ウォレット情報の取得に失敗しました。",
      ),
    };
  }
}

export function getDefaultWalletProfile() {
  return {
    chainType: DEFAULT_CHAIN_TYPE,
    networkName: DEFAULT_NETWORK_NAME,
  };
}
