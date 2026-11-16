export interface StoreManagerInfo {
  store_manager_id: number;
  store_id: number;
  name: string;
  roll_id: number;
}

export interface StoreManagerLoginResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  store_manager: StoreManagerInfo;
}

export interface StoreManagerLoginSuccessResponse {
  status: "success";
  data: StoreManagerLoginResponse;
}
