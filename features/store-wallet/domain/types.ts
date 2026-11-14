export type ApiStatus = "success";

export interface ValidationErrorItem {
  loc: Array<string | number>;
  msg: string;
  type: string;
}

export interface HttpValidationError {
  detail?: ValidationErrorItem[] | string;
}

export interface StoreWalletResponse {
  wallet_id: number;
  wallet_address: string;
  chain_type: string;
  network_name: string;
  token_symbol: string;
  chain_id: number;
  is_active: boolean;
  is_permitted: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

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
  status: ApiStatus;
  data: StoreManagerLoginResponse;
}

export interface WalletNonceCreateRequest {
  wallet_address: string;
  chain_type: string;
  network_name: string;
  token_symbol: string;
  chain_id: number;
}

export interface WalletNonceCreateResponse {
  message: string;
  nonce: string;
  expires_at: string;
}

export interface StoreWalletVerifyRequest {
  wallet_address: string;
  signature: string;
  chain_type: string;
  network_name: string;
  token_symbol: string;
  chain_id: number;
}

export interface StoreWalletVerifyResponse {
  wallet_address: string;
  chain_type: string;
  network_name: string;
  token_symbol: string;
  chain_id: number;
  is_active: boolean;
  verified_at: string;
}

export interface StoreWalletSuccessResponse {
  status: ApiStatus;
  data: StoreWalletResponse | null;
}

export interface WalletNonceCreateSuccessResponse {
  status: ApiStatus;
  data: WalletNonceCreateResponse;
}

export interface StoreWalletVerifySuccessResponse {
  status: ApiStatus;
  data: StoreWalletVerifyResponse;
}

export interface DeleteWalletSuccessResponse {
  status: ApiStatus;
  data: null;
}

export interface ApiErrorResponse extends HttpValidationError {
  message?: string;
}
