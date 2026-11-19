import {
  createStoreApiUrl,
  readJsonOrThrow,
  withAuthorization,
} from "@/lib/store-api-client";
import type {
  DeviceCreateRequest,
  DeviceCreateResponse,
  DeviceActivationCodeResponse,
  DeviceDeleteResponse,
  DeviceDetailResponse,
  DeviceListResponse,
  DeviceSearchParams,
  DeviceUpdateRequest,
  DeviceUpdateResponse,
} from "@/features/device/domain/types";

export function fetchDevices(searchParams: DeviceSearchParams = {}) {
  const query = new URLSearchParams();

  if (searchParams.device_name) {
    query.set("device_name", searchParams.device_name);
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

  return readJsonOrThrow<DeviceListResponse>(
    createStoreApiUrl(`/store/devices${queryString ? `?${queryString}` : ""}`),
    withAuthorization({ cache: "no-store" }),
  );
}

export function createDevice(payload: DeviceCreateRequest) {
  return readJsonOrThrow<DeviceCreateResponse>(
    createStoreApiUrl("/store/devices"),
    withAuthorization({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export function fetchDevice(deviceId: number) {
  return readJsonOrThrow<DeviceDetailResponse>(
    createStoreApiUrl(`/store/devices/${deviceId}`),
    withAuthorization({ cache: "no-store" }),
  );
}

export function updateDevice(deviceId: number, payload: DeviceUpdateRequest) {
  return readJsonOrThrow<DeviceUpdateResponse>(
    createStoreApiUrl(`/store/devices/${deviceId}`),
    withAuthorization({
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export function deleteDevice(deviceId: number) {
  return readJsonOrThrow<DeviceDeleteResponse>(
    createStoreApiUrl(`/store/devices/${deviceId}`),
    withAuthorization({
      method: "DELETE",
    }),
  );
}

export function issueDeviceActivationCode(deviceId: number) {
  return readJsonOrThrow<DeviceActivationCodeResponse>(
    createStoreApiUrl(`/store/devices/${deviceId}/activation-code`),
    withAuthorization({
      method: "POST",
      cache: "no-store",
    }),
  );
}
