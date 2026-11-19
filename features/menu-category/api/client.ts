import {
  createStoreApiUrl,
  readJsonOrThrow,
  withAuthorization,
} from "@/lib/store-api-client";
import type {
  MenuCategoryCreateRequest,
  MenuCategoryCreateResponse,
  MenuCategoryDeleteResponse,
  MenuCategoryDetailResponse,
  MenuCategoryListResponse,
  MenuCategorySearchParams,
  MenuCategoryUpdateRequest,
  MenuCategoryUpdateResponse,
} from "@/features/menu-category/domain/types";

export function fetchMenuCategories(searchParams: MenuCategorySearchParams = {}) {
  const query = new URLSearchParams();

  if (searchParams.name) {
    query.set("name", searchParams.name);
  }
  if (searchParams.is_active !== undefined) {
    query.set("is_active", String(searchParams.is_active));
  }
  if (searchParams.page !== undefined) {
    query.set("page", String(searchParams.page));
  }
  if (searchParams.page_size !== undefined) {
    query.set("page_size", String(searchParams.page_size));
  }

  const queryString = query.toString();

  return readJsonOrThrow<MenuCategoryListResponse>(
    createStoreApiUrl(`/store/menu/categories${queryString ? `?${queryString}` : ""}`),
    withAuthorization({ cache: "no-store" }),
  );
}

export function createMenuCategory(payload: MenuCategoryCreateRequest) {
  return readJsonOrThrow<MenuCategoryCreateResponse>(
    createStoreApiUrl("/store/menu/categories"),
    withAuthorization({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export function fetchMenuCategory(menuCategoryId: number) {
  return readJsonOrThrow<MenuCategoryDetailResponse>(
    createStoreApiUrl(`/store/menu/categories/${menuCategoryId}`),
    withAuthorization({ cache: "no-store" }),
  );
}

export function updateMenuCategory(
  menuCategoryId: number,
  payload: MenuCategoryUpdateRequest,
) {
  return readJsonOrThrow<MenuCategoryUpdateResponse>(
    createStoreApiUrl(`/store/menu/categories/${menuCategoryId}`),
    withAuthorization({
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export function deleteMenuCategory(menuCategoryId: number) {
  return readJsonOrThrow<MenuCategoryDeleteResponse>(
    createStoreApiUrl(`/store/menu/categories/${menuCategoryId}`),
    withAuthorization({ method: "DELETE" }),
  );
}
