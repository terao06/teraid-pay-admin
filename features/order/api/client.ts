import type { OrderListResponse } from "@/features/order/domain/types";
import {
  createStoreApiUrl,
  readJsonOrThrow,
  withAuthorization,
} from "@/lib/store-api-client";

export function fetchUnservedOrders(page: number, signal?: AbortSignal) {
  const query = new URLSearchParams({
    fulfillment_status: "unserved",
    page: String(page),
    page_size: "20",
  });

  return readJsonOrThrow<OrderListResponse>(
    createStoreApiUrl(`/store/orders?${query}`),
    withAuthorization({ cache: "no-store", signal }),
  );
}
