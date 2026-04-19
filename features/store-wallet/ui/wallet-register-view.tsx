"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";

import {
  createWalletNonce,
  readClientError,
  verifyStoreWallet,
} from "@/features/store-wallet/api/client";
import { formatDateTime } from "@/features/store-wallet/domain/format";
import type { WalletNonceCreateResponse } from "@/features/store-wallet/domain/types";
import { FeedbackBanner } from "@/features/store-wallet/ui/feedback-banner";

interface StepFlowArrowProps {
  isActive: boolean;
}

function StepFlowArrow({ isActive }: StepFlowArrowProps) {
  return (
    <Stack spacing={0.5} sx={{ alignItems: "center" }} aria-hidden>
      <Box
        sx={{
          width: 2,
          height: 10,
          bgcolor: isActive ? "primary.main" : "divider",
          borderRadius: 999,
          transition: "background-color 220ms ease",
        }}
      />
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          bgcolor: isActive ? "primary.main" : "grey.300",
          color: isActive ? "primary.contrastText" : "text.secondary",
          display: "grid",
          placeItems: "center",
          fontSize: "1.15rem",
          fontWeight: 800,
          lineHeight: 1,
          boxShadow: isActive ? 2 : 0,
          transition: "all 220ms ease",
        }}
      >
        ↓
      </Box>
      <Box
        sx={{
          width: 2,
          height: 10,
          bgcolor: isActive ? "primary.main" : "divider",
          borderRadius: 999,
          transition: "background-color 220ms ease",
        }}
      />
    </Stack>
  );
}

export function WalletRegisterView() {
  const { address: connectedAddress } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [nonceData, setNonceData] = useState<WalletNonceCreateResponse | null>(null);

  const [isRequestingNonce, setIsRequestingNonce] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRegistrationCompleted, setIsRegistrationCompleted] = useState(false);

  const networkOptions = [
    {
      key: "ethereum-sepolia",
      label: "Ethereum / Sepolia",
      chainType: "ethereum",
      networkName: "sepolia",
    },
    {
      key: "ethereum-mainnet",
      label: "Ethereum / Mainnet",
      chainType: "ethereum",
      networkName: "mainnet",
    },
    {
      key: "polygon-amoy",
      label: "Polygon / Amoy",
      chainType: "polygon",
      networkName: "amoy",
    },
    {
      key: "polygon-mainnet",
      label: "Polygon / Polygon Mainnet",
      chainType: "polygon",
      networkName: "polygon",
    },
  ] as const;
  const [selectedNetworkKey, setSelectedNetworkKey] = useState<string>("");
  const walletAddress = connectedAddress ?? "";
  const selectedNetwork = networkOptions.find((option) => option.key === selectedNetworkKey);

  // 画面初期化時は接続状態をリセットして Step 1 を未接続から開始する
  useEffect(() => {
    disconnect();
  }, [disconnect]);

  const hasConnectedWallet = Boolean(connectedAddress);
  const hasWalletAddress = Boolean(walletAddress.trim());

  useEffect(() => {
    if (!hasConnectedWallet) {
      setSelectedNetworkKey("");
      setNonceData(null);
      setIsRegistrationCompleted(false);
    }
  }, [hasConnectedWallet]);

  const canRequestNonce = hasConnectedWallet && hasWalletAddress && Boolean(selectedNetwork);
  const canVerify = hasConnectedWallet && hasWalletAddress && Boolean(selectedNetwork) && Boolean(nonceData);

  const stepLabels = [
    "ウォレット選択",
    "ネットワーク選択",
    "署名情報取得",
    "署名して登録",
  ];

  let activeStep = 0;
  if (hasConnectedWallet) {
    activeStep = 1;
  }
  if (hasConnectedWallet && selectedNetwork) {
    activeStep = 2;
  }
  if (nonceData) {
    activeStep = 3;
  }
  if (isRegistrationCompleted) {
    activeStep = 3;
  }

  const guideText = isRegistrationCompleted
    ? "登録完了です。必要に応じて別のウォレットを接続して同じ手順を繰り返してください。"
    : activeStep === 0
      ? "まずウォレットを選択して接続してください。"
      : activeStep === 1
        ? "利用するネットワークを選択してください。"
        : activeStep === 2
          ? "ネットワークを選択できました。署名情報を取得して次に進みます。"
          : "署名情報が取得できました。最後に署名して登録を完了してください。";

  function closeFeedback() {
    setStatusMessage(null);
    setErrorMessage(null);
  }

  function resetRegistrationScreen() {
    setSelectedNetworkKey("");
    setNonceData(null);
    setIsRegistrationCompleted(false);
    disconnect();
  }

  async function requestNonce() {
    if (!walletAddress) {
      setErrorMessage("先にウォレットを接続してください。");
      return;
    }
    if (!selectedNetwork) {
      setErrorMessage("先にネットワークを選択してください。");
      return;
    }

    setIsRequestingNonce(true);
    setErrorMessage(null);
    setIsRegistrationCompleted(false);

    try {
      const result = await createWalletNonce({
        wallet_address: walletAddress,
        chain_type: selectedNetwork.chainType,
        network_name: selectedNetwork.networkName,
      });

      setNonceData(result.data);
      setStatusMessage("署名情報を取得しました。署名して登録を完了してください。");
    } catch (error) {
      setErrorMessage(readClientError(error, "署名情報の取得に失敗しました。"));
    } finally {
      setIsRequestingNonce(false);
    }
  }

  async function verifyWallet() {
    if (isVerifying) {
      return;
    }

    if (!connectedAddress) {
      setErrorMessage("署名に利用できるウォレットが接続されていません。");
      return;
    }

    if (!walletAddress) {
      setErrorMessage("ウォレットを接続してください。");
      return;
    }

    if (!nonceData) {
      setErrorMessage("先に 署名情報を取得してください。");
      return;
    }
    if (!selectedNetwork) {
      setErrorMessage("先にネットワークを選択してください。");
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const signature = await signMessageAsync({ message: nonceData.nonce });

      await verifyStoreWallet({
        wallet_address: walletAddress,
        signature,
        chain_type: selectedNetwork.chainType,
        network_name: selectedNetwork.networkName,
      });

      resetRegistrationScreen();
      setStatusMessage("ウォレット登録が完了しました。詳細画面で確認できます。");
    } catch (error) {
      setErrorMessage(readClientError(error, "ウォレット登録に失敗しました。"));
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <Stack spacing={3}>
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

      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.16em" }}>
          Wallet Registration
        </Typography>
        <Typography variant="h4">ウォレット登録</Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3 }}>
        <Stack spacing={2.5}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {stepLabels.map((label) => (
              <Step key={label} completed={isRegistrationCompleted || stepLabels.indexOf(label) < activeStep}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Alert severity="info" variant="outlined">
            {guideText}
          </Alert>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary">
            Step 1. ウォレットを選択
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "center" } }}>
            <ConnectButton chainStatus="none" />
            <Typography variant="body2" color="text.secondary">
              登録に使用するウォレットを選択して接続してください。
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      <StepFlowArrow isActive={activeStep >= 1} />

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary">
            Step 2. ネットワークを選択
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="network-select-label">ネットワーク</InputLabel>
            <Select
              labelId="network-select-label"
              label="ネットワーク"
              value={selectedNetworkKey}
              disabled={!hasConnectedWallet}
              onChange={(event) => {
                setSelectedNetworkKey(event.target.value);
                setNonceData(null);
                setIsRegistrationCompleted(false);
              }}
            >
              <MenuItem value="" disabled>
                ネットワークを選択してください
              </MenuItem>
              {networkOptions.map((option) => (
                <MenuItem key={option.key} value={option.key}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            署名情報の作成と登録は、ここで選択したネットワークで実行されます。
          </Typography>
        </Stack>
      </Paper>

      <StepFlowArrow isActive={Boolean(hasConnectedWallet && selectedNetwork)} />

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary">
            Step 3. 署名情報を取得
          </Typography>

          <Button onClick={requestNonce} variant="outlined" disabled={isRequestingNonce || !canRequestNonce}>
            {isRequestingNonce ? "取得中..." : "署名情報を取得"}
          </Button>

          <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
            <Typography sx={{ fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>
              {nonceData?.nonce ?? "未取得"}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
              有効期限: {nonceData ? formatDateTime(nonceData.expires_at, "--") : "--"}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <StepFlowArrow isActive={activeStep >= 3} />

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary">
            Step 4. 署名して登録
          </Typography>
          <Typography variant="body2" color="text.secondary">
            署名情報を使いをウォレットで署名し、本人確認を完了します。
          </Typography>
          <Button onClick={verifyWallet} variant="contained" disabled={isVerifying || !canVerify}>
            {isVerifying ? "署名中..." : "署名して登録"}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
