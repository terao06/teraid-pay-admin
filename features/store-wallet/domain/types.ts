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
  status: "success";
  data: StoreWalletResponse | null;
}

export interface WalletNonceCreateSuccessResponse {
  status: "success";
  data: WalletNonceCreateResponse;
}

export interface StoreWalletVerifySuccessResponse {
  status: "success";
  data: StoreWalletVerifyResponse;
}

export interface DeleteWalletSuccessResponse {
  status: "success";
  data: null;
}
