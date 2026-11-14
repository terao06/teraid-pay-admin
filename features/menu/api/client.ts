import {
  createStoreApiUrl,
  readJsonOrThrow,
  withAuthorization,
} from "@/features/store-wallet/api/client";
import type {
  MenuCategoriesSuccessResponse,
  MenuCreateRequest,
  MenuCreateSuccessResponse,
} from "@/features/menu/domain/types";

export function fetchMenuCategories() {
  return readJsonOrThrow<MenuCategoriesSuccessResponse>(
    createStoreApiUrl("/store/menu/categories"),
    withAuthorization({ cache: "no-store" }),
  );
}

export function createMenu(payload: MenuCreateRequest) {
  return readJsonOrThrow<MenuCreateSuccessResponse>(
    createStoreApiUrl("/store/menu"),
    withAuthorization({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}
