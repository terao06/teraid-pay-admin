"use client";

import { type FormEvent, useState } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DevicesRoundedIcon from "@mui/icons-material/DevicesRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import NextLink from "next/link";
import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { createDevice } from "@/features/device/api/client";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { readClientError } from "@/lib/store-api-client";

export function DeviceCreateView() {
  const [deviceName, setDeviceName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const normalizedDeviceName = deviceName.trim();
  const isNameValid = normalizedDeviceName.length >= 1 && normalizedDeviceName.length <= 100;
  const canSubmit = isNameValid && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!isNameValid) {
      setErrorMessage("デバイス名を1〜100文字で入力してください。");
      return;
    }

    setIsSubmitting(true);
    try {
      await createDevice({ device_name: normalizedDeviceName });
      setDeviceName("");
      setStatusMessage(`「${normalizedDeviceName}」を登録しました。`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setErrorMessage(readClientError(error, "デバイスの登録に失敗しました。"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <LoadingOverlay open={isSubmitting} label="デバイスを登録しています…" />
      <FeedbackBanner message={errorMessage} severity="error" onClose={() => setErrorMessage(null)} />
      <FeedbackBanner message={statusMessage} severity="success" onClose={() => setStatusMessage(null)} />

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={3}>
          <Box>
            <Button
              component={NextLink}
              href="/devices"
              startIcon={<ArrowBackRoundedIcon />}
              sx={{ px: 0, mb: 1 }}
            >
              デバイス一覧へ戻る
            </Button>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              デバイス新規登録
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              店舗で利用するデバイスの名称を入力してください。
            </Typography>
          </Box>

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
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    デバイスの基本情報
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    管理画面で識別しやすい名称を設定します。
                  </Typography>
                </Box>
              </Stack>
              <Divider />
              <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
                <TextField
                  label="デバイス名"
                  value={deviceName}
                  onChange={(event) => setDeviceName(event.target.value)}
                  required
                  autoFocus
                  placeholder="例：1階 レジ端末"
                  error={deviceName.length > 100}
                  helperText={
                    <Box component="span" sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                      <span>設置場所や用途が分かる名前がおすすめです。</span>
                      <span>{deviceName.length}/100</span>
                    </Box>
                  }
                  slotProps={{ htmlInput: { maxLength: 100 } }}
                />
              </Stack>
          </Paper>

          <Alert severity="info" icon={<InfoOutlinedIcon />}>
            デバイス名は登録後も変更できます。同じ設置場所に複数台ある場合は、番号などを含めてください。
          </Alert>

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1.5,
              justifyContent: "flex-end",
              alignItems: { sm: "center" },
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mr: { sm: "auto" } }}>
              必須項目を入力して、登録内容をご確認ください。
            </Typography>
            <Button
              type="button"
              variant="outlined"
              color="inherit"
              startIcon={<RestartAltRoundedIcon />}
              onClick={() => {
                setDeviceName("");
                setErrorMessage(null);
              }}
              disabled={!deviceName || isSubmitting}
            >
              入力をクリア
            </Button>
            <Button component={NextLink} href="/devices" variant="outlined" color="inherit">
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<SaveRoundedIcon />}
              disabled={!canSubmit}
            >
              この内容で登録する
            </Button>
          </Paper>
        </Stack>
      </Box>
    </>
  );
}
