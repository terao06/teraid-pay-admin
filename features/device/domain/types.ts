export interface DeviceListItem {
  device_id: number;
  device_name: string;
  is_active: boolean;
  created_at: string;
}

export interface DevicePagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface DeviceListResponse {
  status: "success";
  data: {
    devices: DeviceListItem[];
    pagination: DevicePagination;
  };
}

export interface DeviceSearchParams {
  device_name?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface DeviceCreateRequest {
  device_name: string;
}

export interface DeviceCreateResponse {
  status: "success";
  data: {
    device_id: number;
  };
}

export interface DeviceDetail {
  device_id: number;
  device_name: string;
  is_active: boolean;
  activated_at: string | null;
  last_authenticated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceDetailResponse {
  status: "success";
  data: DeviceDetail;
}

export interface DeviceUpdateRequest {
  device_name: string;
  is_active: boolean;
}

export interface DeviceUpdateResponse {
  status: "success";
  data: {
    device_id: number;
  };
}

export interface DeviceDeleteResponse {
  status: "success";
  data: {
    device_id: number;
  };
}

export interface DeviceActivationCode {
  device_id: number;
  activation_code: string;
  qr_code_image: string;
  activation_expires_at: string;
}

export interface DeviceActivationCodeResponse {
  status: "success";
  data: DeviceActivationCode;
}
