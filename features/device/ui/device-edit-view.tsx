"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DevicesRoundedIcon from "@mui/icons-material/DevicesRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import { fetchDevice, issueDeviceActivationCode, updateDevice } from "@/features/device/api/client";
import type { DeviceActivationCode, DeviceDetail } from "@/features/device/domain/types";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { readClientError } from "@/lib/store-api-client";

function formatDateTime(value: string | null) {
  if (!value) {
    return "未記録";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "baseline" }}>
      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 750, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </Typography>
    </Stack>
  );
}

export function DeviceEditView() {
  const searchParams = useSearchParams();
  const deviceIdParam = searchParams.get("id");
  const deviceId = Number(deviceIdParam);
  const isValidDeviceId =
    deviceIdParam !== null &&
    deviceIdParam !== "" &&
    Number.isInteger(deviceId) &&
    deviceId >= 1;

  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(isValidDeviceId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIssuingActivationCode, setIsIssuingActivationCode] = useState(false);
  const [activationCodeInfo, setActivationCodeInfo] = useState<DeviceActivationCode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const applyDevice = useCallback((nextDevice: DeviceDetail) => {
    setDevice(nextDevice);
    setDeviceName(nextDevice.device_name);
    setIsActive(nextDevice.is_active);
  }, []);

  const loadDevice = useCallback(async () => {
    if (!isValidDeviceId) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await fetchDevice(deviceId);
      applyDevice(result.data);
    } catch (error) {
      setErrorMessage(readClientError(error, "デバイスの詳細取得に失敗しました。"));
    } finally {
      setIsLoading(false);
    }
  }, [applyDevice, deviceId, isValidDeviceId]);

  useEffect(() => {
    if (!isValidDeviceId) {
      return;
    }

    let isMounted = true;

    void fetchDevice(deviceId)
      .then((result) => {
        if (isMounted) {
          applyDevice(result.data);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(readClientError(error, "デバイスの詳細取得に失敗しました。"));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [applyDevice, deviceId, isValidDeviceId]);

  const normalizedDeviceName = deviceName.trim();
  const isNameValid = normalizedDeviceName.length >= 1 && normalizedDeviceName.length <= 100;
  const hasChanges =
    device !== null &&
    (normalizedDeviceName !== device.device_name || isActive !== device.is_active);
  const canActivate = device?.activated_at !== null;
  const canSubmit = Boolean(device) && isNameValid && hasChanges && !isLoading && !isSubmitting;

  async function handleIssueActivationCode() {
    if (!device || device.activated_at !== null) {
      return;
    }

    setIsIssuingActivationCode(true);
    setErrorMessage(null);
    try {
      const result = await issueDeviceActivationCode(device.device_id);
      setActivationCodeInfo(result.data);
    } catch (error) {
      setErrorMessage(readClientError(error, "デバイス設定用QRコードの発行に失敗しました。"));
    } finally {
      setIsIssuingActivationCode(false);
    }
  }

  function closeActivationCodeDialog() {
    setActivationCodeInfo(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!device || !isNameValid || !hasChanges) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const updateResult = await updateDevice(device.device_id, {
        device_name: normalizedDeviceName,
        is_active: isActive,
      });
      let detailResult: Awaited<ReturnType<typeof fetchDevice>>;
      try {
        detailResult = await fetchDevice(updateResult.data.device_id);
      } catch (error) {
        setStatusMessage(`「${normalizedDeviceName}」を更新しました。`);
        setErrorMessage(
          readClientError(error, "更新は完了しましたが、最新情報の取得に失敗しました。"),
        );
        return;
      }
      applyDevice(detailResult.data);
      setStatusMessage(`「${detailResult.data.device_name}」を更新しました。`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setErrorMessage(readClientError(error, "デバイスの更新に失敗しました。"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isValidDeviceId) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">編集対象のデバイスが正しくありません。</Alert>
        <Button component={NextLink} href="/devices" startIcon={<ArrowBackRoundedIcon />} sx={{ alignSelf: "flex-start" }}>
          デバイス一覧へ戻る
        </Button>
      </Stack>
    );
  }

  return (
    <>
      <LoadingOverlay
        open={isLoading || isSubmitting}
        label={isSubmitting ? "デバイスを更新しています…" : "デバイスを読み込んでいます…"}
      />
      <FeedbackBanner message={errorMessage} severity="error" onClose={() => setErrorMessage(null)} />
      <FeedbackBanner message={statusMessage} severity="success" onClose={() => setStatusMessage(null)} />

      <Dialog
        open={activationCodeInfo !== null}
        onClose={closeActivationCodeDialog}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ pr: 7 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 900 }}>
            デバイス設定用QRコード
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {device?.device_name ?? "デバイス"} の設定画面で読み取ってください。
          </Typography>
          <IconButton
            aria-label="QRコードを閉じる"
            onClick={closeActivationCodeDialog}
            sx={{ position: "absolute", top: 12, right: 12 }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {activationCodeInfo ? (
            <Stack spacing={2.5} sx={{ alignItems: "center", py: 1 }}>
              <Box
                sx={{
                  width: "min(100%, 320px)",
                  aspectRatio: "1 / 1",
                  display: "grid",
                  placeItems: "center",
                  p: 2,
                  bgcolor: "#ffffff",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  boxShadow: "0 12px 32px rgba(23,32,51,0.08)",
                }}
              >
                <Box
                  component="img"
                  src={activationCodeInfo.qr_code_image}
                  alt={`${device?.device_name ?? "デバイス"}のデバイス設定用QRコード`}
                  sx={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
                />
              </Box>

              <Box sx={{ width: "100%", textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  有効化コード
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ mt: 0.5, fontWeight: 900, letterSpacing: "0.08em", fontFamily: "var(--font-mono)" }}
                >
                  {activationCodeInfo.activation_code}
                </Typography>
              </Box>

              <Alert severity="warning" sx={{ width: "100%" }}>
                有効期限：{formatDateTime(activationCodeInfo.activation_expires_at)}
                <br />
                このQRコードと有効化コードは、ダイアログを閉じると再表示できません。
              </Alert>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="contained" onClick={closeActivationCodeDialog} fullWidth>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          <Box>
            <Button component={NextLink} href="/devices" startIcon={<ArrowBackRoundedIcon />} sx={{ px: 0, mb: 1 }}>
              デバイス一覧へ戻る
            </Button>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              デバイス編集
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              デバイスの詳細を確認し、名称と利用状態を更新してください。
            </Typography>
          </Box>

          {errorMessage && !device && !isLoading ? (
            <Alert
              severity="error"
              action={<Button color="inherit" size="small" onClick={() => void loadDevice()}>再試行</Button>}
            >
              {errorMessage}
            </Alert>
          ) : null}

          {device ? (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 320px" },
                  gap: 3,
                  alignItems: "start",
                }}
              >
                <Paper variant="outlined" sx={{ overflow: "hidden" }}>
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{ p: { xs: 2.5, md: 3 }, alignItems: "center", bgcolor: "rgba(24, 169, 123, 0.06)" }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 2.5,
                        color: "primary.contrastText",
                        bgcolor: "primary.main",
                        flexShrink: 0,
                      }}
                    >
                      <DevicesRoundedIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 850 }}>基本情報</Typography>
                      <Typography variant="body2" color="text.secondary">名称と利用状態を変更できます。</Typography>
                    </Box>
                  </Stack>
                  <Divider />
                  <Stack spacing={3} sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>デバイス名</Typography>
                      <TextField
                        value={deviceName}
                        onChange={(event) => setDeviceName(event.target.value)}
                        required
                        error={deviceName.length > 100 || normalizedDeviceName.length === 0}
                        helperText={
                          <Box component="span" sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                            <span>設置場所と用途が分かる名前にすると識別しやすくなります。</span>
                            <span>{deviceName.length}/100</span>
                          </Box>
                        }
                        slotProps={{ htmlInput: { maxLength: 100, "aria-label": "デバイス名" } }}
                      />
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>利用状態</Typography>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          boxShadow: "none",
                          borderColor: isActive ? "rgba(24,169,123,0.35)" : "divider",
                          bgcolor: isActive ? "#f1fbf7" : "#f8fafc",
                          transition: "border-color 160ms ease, background-color 160ms ease",
                        }}
                      >
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={2}
                          sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
                        >
                          <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                            <Box sx={{ mt: 0.25, color: isActive ? "primary.main" : "text.disabled" }}>
                              {isActive ? <CheckCircleRoundedIcon /> : <VisibilityOffRoundedIcon />}
                            </Box>
                            <Box>
                              <Typography sx={{ fontWeight: 850 }}>{isActive ? "有効" : "無効"}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.65 }}>
                                {isActive
                                  ? "このデバイスからサービスを利用できます。"
                                  : "このデバイスからサービスを利用できません。"}
                              </Typography>
                            </Box>
                          </Stack>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={isActive}
                                onChange={(event) => setIsActive(event.target.checked)}
                                disabled={!canActivate && !isActive}
                                slotProps={{ input: { "aria-label": "デバイスの利用状態" } }}
                              />
                            }
                            label={isActive ? "有効" : "無効"}
                            labelPlacement="start"
                            sx={{ m: 0, flexShrink: 0, "& .MuiFormControlLabel-label": { fontWeight: 850 } }}
                          />
                        </Stack>
                      </Paper>
                      {!canActivate ? (
                        <Stack direction="row" spacing={1} sx={{ mt: 1.25, alignItems: "flex-start", color: "text.secondary" }}>
                          <InfoOutlinedIcon fontSize="small" sx={{ mt: 0.15, flexShrink: 0 }} />
                          <Typography variant="caption" sx={{ lineHeight: 1.6 }}>
                            初回有効化が完了するまで、有効状態には変更できません。
                          </Typography>
                        </Stack>
                      ) : null}
                    </Box>
                  </Stack>
                  <Divider />
                  <Box
                    sx={{
                      p: { xs: 2.5, md: 3 },
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      rowGap: 2.25,
                      bgcolor: "#f8fafc",
                    }}
                  >
                    <MetaRow label="初回有効化" value={formatDateTime(device.activated_at)} />
                    <MetaRow label="最終認証" value={formatDateTime(device.last_authenticated_at)} />
                    <MetaRow label="登録日時" value={formatDateTime(device.created_at)} />
                    <MetaRow label="最終更新" value={formatDateTime(device.updated_at)} />
                  </Box>
                </Paper>

                <Stack spacing={2}>
                  <Paper variant="outlined" sx={{ overflow: "hidden" }}>
                    <Stack
                      direction="row"
                      spacing={1.25}
                      sx={{ px: 2.5, py: 2, alignItems: "center", bgcolor: "rgba(108, 99, 255, 0.06)" }}
                    >
                      <QrCode2RoundedIcon color="secondary" />
                      <Box>
                        <Typography sx={{ fontWeight: 850 }}>デバイス設定</Typography>
                        <Typography variant="caption" color="text.secondary">初回セットアップ用</Typography>
                      </Box>
                    </Stack>
                    <Divider />
                    <Stack spacing={1.5} sx={{ p: 2.25 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        QRコードを発行し、対象のデバイスで読み取ると初回設定を開始できます。
                      </Typography>
                      <Button
                        type="button"
                        variant="contained"
                        startIcon={<QrCode2RoundedIcon />}
                        onClick={() => void handleIssueActivationCode()}
                        disabled={device.activated_at !== null || isIssuingActivationCode}
                        fullWidth
                      >
                        {isIssuingActivationCode ? "発行しています…" : "設定用QRコードを表示"}
                      </Button>
                      {device.activated_at !== null ? (
                        <Typography variant="caption" color="text.secondary">
                          このデバイスは有効化済みのため、設定用QRコードは発行できません。
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="warning.dark">
                          再発行すると、以前の有効化コードは使用できなくなります。
                        </Typography>
                      )}
                    </Stack>
                  </Paper>

                </Stack>
              </Box>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 1.5,
                  alignItems: { md: "center" },
                  boxShadow: "none",
                  borderColor: hasChanges ? "rgba(24,169,123,0.35)" : "divider",
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mr: { md: "auto" } }}>
                  変更内容を確認して更新してください。
                </Typography>
                <Button component={NextLink} href="/devices" variant="outlined" color="inherit">キャンセル</Button>
                <Button type="submit" variant="contained" size="large" startIcon={<SaveRoundedIcon />} disabled={!canSubmit}>
                  この内容で更新する
                </Button>
              </Paper>
            </>
          ) : null}
        </Stack>
      </Box>
    </>
  );
}
