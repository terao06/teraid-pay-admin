import {
  createStoreApiUrl,
  readJsonOrThrow,
  requestOrThrow,
  withAuthorization,
} from "@/lib/store-api-client";
import type { StoreManagerLoginSuccessResponse } from "@/features/auth/domain/types";

export function loginStoreManager(email: string, password: string) {
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

export function logoutStoreManager() {
  return requestOrThrow(
    createStoreApiUrl("/store/manager/logout"),
    withAuthorization({ method: "POST" }),
  );
}
