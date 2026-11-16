import {
  DEFAULT_CHAIN_TYPE,
  DEFAULT_CHAIN_ID,
  DEFAULT_NETWORK_NAME,
  DEFAULT_TOKEN_SYMBOL,
} from "@/features/store-wallet/domain/config";
import {
  createStoreApiUrl,
  readJsonOrThrow,
  withAuthorization,
} from "@/lib/store-api-client";
import type {
  DeleteWalletSuccessResponse,
  StoreWalletSuccessResponse,
  StoreWalletVerifyRequest,
  StoreWalletVerifySuccessResponse,
  WalletNonceCreateRequest,
  WalletNonceCreateSuccessResponse,
} from "@/features/store-wallet/domain/types";

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
