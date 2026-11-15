import {
  createStoreApiUrl,
  readJsonOrThrow,
  withAuthorization,
} from "@/features/store-wallet/api/client";
export { fetchMenuCategories } from "@/features/menu-category/api/client";
import type {
  MenuCreateRequest,
  MenuCreateSuccessResponse,
  MenuDetailResponse,
  MenuListSuccessResponse,
  MenuOptionGroupsUpdateRequest,
  MenuOptionGroupsUpdateResponse,
  MenuSearchParams,
  MenuUpdateRequest,
  MenuUpdateResponse,
} from "@/features/menu/domain/types";

export function fetchMenus(searchParams: MenuSearchParams = {}) {
  const query = new URLSearchParams();
  if (searchParams.name) {
    query.set("name", searchParams.name);
  }
  if (searchParams.menu_category_id !== undefined) {
    query.set("menu_category_id", String(searchParams.menu_category_id));
  }
  if (searchParams.is_available !== undefined) {
    query.set("is_available", String(searchParams.is_available));
  }
  if (searchParams.page !== undefined) {
    query.set("page", String(searchParams.page));
  }
  if (searchParams.page_size !== undefined) {
    query.set("page_size", String(searchParams.page_size));
  }
  const queryString = query.toString();

  return readJsonOrThrow<MenuListSuccessResponse>(
    createStoreApiUrl(`/store/menu${queryString ? `?${queryString}` : ""}`),
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

export function fetchMenu(menuItemId: number) {
  return readJsonOrThrow<MenuDetailResponse>(
    createStoreApiUrl(`/store/menu/${menuItemId}`),
    withAuthorization({ cache: "no-store" }),
  );
}

export function updateMenu(menuItemId: number, payload: MenuUpdateRequest) {
  return readJsonOrThrow<MenuUpdateResponse>(
    createStoreApiUrl(`/store/menu/${menuItemId}`),
    withAuthorization({
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export function updateMenuOptionGroups(
  menuItemId: number,
  payload: MenuOptionGroupsUpdateRequest,
) {
  return readJsonOrThrow<MenuOptionGroupsUpdateResponse>(
    createStoreApiUrl(`/store/menu/${menuItemId}/option-groups`),
    withAuthorization({
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}
