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
  store_wallet_id: number;
  store_id: number;
  wallet_address: string;
  chain_type: string;
  network_name: string;
  is_active: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletNonceCreateRequest {
  wallet_address: string;
  chain_type: string;
  network_name: string;
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
}

export interface StoreWalletVerifyResponse {
  wallet_address: string;
  chain_type: string;
  network_name: string;
  is_primary: boolean;
  is_active: boolean;
  verified_at: string;
}

export interface StoreWalletSuccessResponse {
  status: ApiStatus;
  data: StoreWalletResponse;
}

export interface WalletNonceCreateSuccessResponse {
  status: ApiStatus;
  data: WalletNonceCreateResponse;
}

export interface StoreWalletVerifySuccessResponse {
  status: ApiStatus;
  data: StoreWalletVerifyResponse;
}

export interface ApiErrorResponse extends HttpValidationError {
  message?: string;
}
