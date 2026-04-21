"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { isAddress } from "viem";
import type { Address } from "viem";
import { useBalance } from "wagmi";

import {
  deleteStoreWallet,
  fetchStoreWallet,
  readClientError,
} from "@/features/store-wallet/api/client";
import { formatDateTime } from "@/features/store-wallet/domain/format";
import type { StoreWalletResponse } from "@/features/store-wallet/domain/types";
import { FeedbackBanner } from "@/features/store-wallet/ui/feedback-banner";
import { LoadingOverlay } from "@/features/store-wallet/ui/loading-overlay";

interface WalletDetailViewProps {
  initialWallet?: StoreWalletResponse | null;
  initialError?: string;
}

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ py: 1.5 }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ minWidth: 160, fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1 }}>{value}</Box>
    </Stack>
  );
}

function resolveChainId(chainType: string, networkName: string) {
  if (chainType === "ethereum" && networkName === "sepolia") {
    return 11155111;
  }

  if (chainType === "ethereum" && networkName === "mainnet") {
    return 1;
  }

  if (chainType === "polygon" && networkName === "polygon") {
    return 137;
  }

  if (chainType === "polygon" && networkName === "amoy") {
    return 80002;
  }

  return undefined;
}

function resolveJpycTokenAddress(chainType: string, networkName: string) {
  if (chainType === "ethereum" && networkName === "mainnet") {
    return process.env.NEXT_PUBLIC_JPYC_TOKEN_ADDRESS_ETHEREUM_MAINNET;
  }

  if (chainType === "ethereum" && networkName === "sepolia") {
    return process.env.NEXT_PUBLIC_JPYC_TOKEN_ADDRESS_ETHEREUM_SEPOLIA;
  }

  if (chainType === "polygon" && networkName === "polygon") {
    return process.env.NEXT_PUBLIC_JPYC_TOKEN_ADDRESS_POLYGON_MAINNET;
  }

  if (chainType === "polygon" && networkName === "amoy") {
    return process.env.NEXT_PUBLIC_JPYC_TOKEN_ADDRESS_POLYGON_AMOY;
  }

  return undefined;
}

function resolveRpcUrl(chainType: string, networkName: string) {
  if (chainType === "ethereum" && networkName === "mainnet") {
    return process.env.NEXT_PUBLIC_RPC_URL_ETHEREUM_MAINNET;
  }

  if (chainType === "ethereum" && networkName === "sepolia") {
    return process.env.NEXT_PUBLIC_RPC_URL_ETHEREUM_SEPOLIA;
  }

  if (chainType === "polygon" && networkName === "polygon") {
    return process.env.NEXT_PUBLIC_RPC_URL_POLYGON_MAINNET;
  }

  if (chainType === "polygon" && networkName === "amoy") {
    return process.env.NEXT_PUBLIC_RPC_URL_POLYGON_AMOY;
  }

  return undefined;
}

function formatBalanceAmount(value: string) {
  const [integerPart, decimalPart] = value.split(".");
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (!decimalPart) {
    return groupedInteger;
  }

  const trimmedDecimal = decimalPart.replace(/0+$/, "").slice(0, 4);
  if (!trimmedDecimal) {
    return groupedInteger;
  }

  return `${groupedInteger}.${trimmedDecimal}`;
}

export function WalletDetailView({
  initialWallet = null,
  initialError,
}: WalletDetailViewProps) {
  const [wallet, setWallet] = useState(initialWallet);
  const [isInitialLoading, setIsInitialLoading] = useState(!initialWallet && !initialError);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError ?? null);
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const chainId = wallet
    ? resolveChainId(wallet.chain_type, wallet.network_name)
    : undefined;

  const jpycTokenAddress = wallet
    ? resolveJpycTokenAddress(wallet.chain_type, wallet.network_name)
    : undefined;
  const rpcUrl = wallet
    ? resolveRpcUrl(wallet.chain_type, wallet.network_name)
    : undefined;

  const walletAddress: Address | undefined =
    wallet && isAddress(wallet.wallet_address)
      ? wallet.wallet_address
      : undefined;
  const jpycTokenContractAddress: Address | undefined =
    jpycTokenAddress && isAddress(jpycTokenAddress)
      ? jpycTokenAddress
      : undefined;

  const canReadBalance = Boolean(
    wallet &&
      chainId &&
      rpcUrl &&
      walletAddress &&
      jpycTokenContractAddress,
  );

  const {
    data: balance,
    isFetching: isBalanceFetching,
    error: balanceError,
    refetch: refetchBalance,
  } = useBalance({
    address: canReadBalance ? walletAddress : undefined,
    chainId,
    token: canReadBalance ? jpycTokenContractAddress : undefined,
    query: {
      enabled: canReadBalance,
    },
  });

  const balanceLabel = (() => {
    if (!wallet) {
      return "--";
    }

    if (!chainId) {
      return "未対応ネットワーク";
    }

    if (!jpycTokenAddress) {
      return "JPYCトークン未設定";
    }

    if (!rpcUrl) {
      return "RPCエンドポイント未設定";
    }

    if (!isAddress(jpycTokenAddress)) {
      return "JPYCアドレス設定エラー";
    }

    if (!isAddress(wallet.wallet_address)) {
      return "アドレス形式エラー";
    }

    if (isBalanceFetching) {
      return "取得中...";
    }

    if (balanceError) {
      return "取得失敗";
    }

    if (!balance) {
      return "--";
    }

    return `${balance.formatted} ${balance.symbol ?? "JPYC"}`;
  })();

  const formattedBalanceNumber = balance ? formatBalanceAmount(balance.formatted) : "--";
  const isBalanceReady = Boolean(balance && !isBalanceFetching && !balanceError);
  const balanceStatusText = (() => {
    if (!wallet) {
      return "--";
    }

    if (!chainId) {
      return "未対応ネットワーク";
    }

    if (!jpycTokenAddress) {
      return "JPYCトークン未設定";
    }

    if (!rpcUrl) {
      return "RPCエンドポイント未設定";
    }

    if (!isAddress(jpycTokenAddress)) {
      return "JPYCアドレス設定エラー";
    }

    if (!isAddress(wallet.wallet_address)) {
      return "アドレス形式エラー";
    }

    if (isBalanceFetching) {
      return "最新残高を取得中です";
    }

    if (balanceError) {
      return "残高の取得に失敗しました";
    }

    return "利用可能残高";
  })();

  const displayBalanceNumber =
    hasMounted && isBalanceReady ? formattedBalanceNumber : "--";
  const displayBalanceStatusText = hasMounted
    ? isBalanceReady
      ? "1 JPYC = 1 円"
      : balanceStatusText
    : "残高を確認しています";
  const displayBalanceDetail =
    hasMounted && !isBalanceReady && balanceLabel !== "--"
      ? balanceLabel
      : null;

  useEffect(() => {
    if (initialWallet || initialError) {
      return;
    }

    let isCancelled = false;

    async function loadWallet() {
      setIsInitialLoading(true);

      try {
        const result = await fetchStoreWallet({ cache: "no-store" });
        if (isCancelled) {
          return;
        }

        setWallet(result.data);
        setErrorMessage(null);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setWallet(null);
        setErrorMessage(readClientError(error, "ウォレット情報の取得に失敗しました。"));
      } finally {
        if (!isCancelled) {
          setIsInitialLoading(false);
        }
      }
    }

    void loadWallet();

    return () => {
      isCancelled = true;
    };
  }, [initialError, initialWallet]);

  function closeFeedback() {
    setStatusMessage(null);
    setErrorMessage(null);
  }

  async function refreshWallet() {
    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const result = await fetchStoreWallet({ cache: "no-store" });
      setWallet(result.data);
      await refetchBalance();
    } catch (error) {
      setErrorMessage(readClientError(error, "ウォレット情報の取得に失敗しました。"));
    } finally {
      setIsRefreshing(false);
    }
  }

  function openDeleteDialog() {
    setIsDeleteDialogOpen(true);
  }

  function closeDeleteDialog() {
    if (isDeleting) {
      return;
    }

    setIsDeleteDialogOpen(false);
  }

  async function handleDeleteWallet() {
    if (!wallet || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteStoreWallet(wallet.wallet_id);
      setWallet(null);
      setStatusMessage("ウォレットを削除しました。");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      setErrorMessage(readClientError(error, "ウォレットの削除に失敗しました。"));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Stack spacing={3}>
      <LoadingOverlay
        open={isInitialLoading || isRefreshing || isDeleting}
        label={isDeleting ? "削除中..." : isRefreshing ? "更新中..." : "読み込み中..."}
      />
      <FeedbackBanner
        message={errorMessage}
        severity="error"
        onClose={closeFeedback}
      />
      <FeedbackBanner
        message={statusMessage}
        severity="success"
        onClose={closeFeedback}
      />

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" } }}
      >
        <Box>
          <Typography variant="h4">ウォレット詳細</Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          {wallet ? (
            <Button
              onClick={openDeleteDialog}
              variant="outlined"
              color="error"
              disabled={isRefreshing || isDeleting}
            >
              削除
            </Button>
          ) : null}
          <Button onClick={refreshWallet} variant="contained" disabled={isRefreshing || isDeleting}>
            {isRefreshing ? "更新中..." : "再読み込み"}
          </Button>
        </Stack>
      </Stack>

      {isInitialLoading ? (
        <Alert severity="info" variant="outlined">
          ウォレット情報を読み込み中です。
        </Alert>
      ) : wallet === null ? (
        <Alert severity="info" variant="outlined">
          登録済みのウォレットはまだありません。
        </Alert>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 3, px: 3, py: 1 }}>
          <DetailRow
            label="Wallet ID"
            value={
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                #{wallet.wallet_id}
              </Typography>
            }
          />
          <Divider />
          <DetailRow
            label="Wallet Address"
            value={
              <Typography
                variant="body2"
                sx={{ fontFamily: "var(--font-mono)", wordBreak: "break-all" }}
              >
                {wallet.wallet_address}
              </Typography>
            }
          />
          <Divider />
          <DetailRow
            label="Chain Type"
            value={<Typography variant="body2">{wallet.chain_type}</Typography>}
          />
          <Divider />
          <DetailRow
            label="Network"
            value={<Typography variant="body2">{wallet.network_name}</Typography>}
          />
          <Divider />
          <DetailRow
            label="JPYC Balance"
            value={(
              <Box
                sx={{
                  borderRadius: 2.5,
                  px: 2,
                  py: 1.5,
                  border: "1px solid",
                  borderColor: "primary.light",
                  background:
                    "linear-gradient(140deg, rgba(44,156,142,0.12), rgba(180,83,9,0.08))",
                }}
              >
                <Stack spacing={0.8}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      残高
                    </Typography>
                    <Chip size="small" label="JPYC" color="primary" sx={{ fontWeight: 700 }} />
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "baseline" }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        fontFamily: "var(--font-heading)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.1,
                      }}
                    >
                      {displayBalanceNumber}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      JPYC
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {displayBalanceStatusText}
                  </Typography>
                  {displayBalanceDetail ? (
                    <Typography variant="caption" color="text.secondary">
                      {displayBalanceDetail}
                    </Typography>
                  ) : null}
                </Stack>
              </Box>
            )}
          />
          <Divider />
          <DetailRow
            label="Status"
            value={
              <Chip
                size="small"
                label={wallet.is_active ? "有効" : "無効"}
                color={wallet.is_active ? "success" : "warning"}
              />
            }
          />
          <Divider />
          <DetailRow
            label="Verified At"
            value={
              <Typography variant="body2">
                {formatDateTime(wallet.verified_at, "未認証")}
              </Typography>
            }
          />
          <Divider />
          <DetailRow
            label="Created At"
            value={
              <Typography variant="body2">
                {formatDateTime(wallet.created_at, "--")}
              </Typography>
            }
          />
          <Divider />
          <DetailRow
            label="Updated At"
            value={
              <Typography variant="body2">
                {formatDateTime(wallet.updated_at, "--")}
              </Typography>
            }
          />
        </Paper>
      )}

      <Dialog open={isDeleteDialogOpen} onClose={closeDeleteDialog} fullWidth maxWidth="xs">
        <DialogTitle>ウォレットを削除しますか？</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              削除後は登録情報が画面から消えます。必要な場合は再度ウォレット登録を行ってください。
            </Typography>
            {wallet ? (
              <Typography
                variant="body2"
                sx={{ fontFamily: "var(--font-mono)", wordBreak: "break-all" }}
              >
                {wallet.wallet_address}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={isDeleting}>
            キャンセル
          </Button>
          <Button
            onClick={handleDeleteWallet}
            color="error"
            variant="contained"
            disabled={isDeleting || !wallet}
          >
            {isDeleting ? "削除中..." : "削除する"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
