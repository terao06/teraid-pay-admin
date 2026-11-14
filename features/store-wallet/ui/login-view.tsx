"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  loginStoreManager,
  readClientError,
} from "@/features/store-wallet/api/client";
import { useAuth } from "@/features/store-wallet/auth/auth-provider";

export function LoginView() {
  const router = useRouter();
  const { session, isReady, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && session) {
      router.replace("/");
    }
  }, [isReady, router, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await loginStoreManager(email.trim(), password);
      signIn(result.data);
      router.replace("/");
    } catch (error) {
      setErrorMessage(readClientError(error, "ログインに失敗しました。"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isReady || session) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress size={34} />
      </Box>
    );
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: 5,
        background:
          "radial-gradient(circle at top left, rgba(44,156,142,0.16), transparent 42%), background.default",
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        variant="outlined"
        sx={{ width: "100%", maxWidth: 440, borderRadius: 4, p: { xs: 3, sm: 4 } }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 800 }}>
              TeraiD Pay Admin
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.5 }}>
              管理者ログイン
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              店舗管理者のメールアドレスとパスワードを入力してください。
            </Typography>
          </Box>

          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          <TextField
            label="メールアドレス"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            autoFocus
            required
            fullWidth
            disabled={isSubmitting}
            slotProps={{ htmlInput: { minLength: 3, maxLength: 255 } }}
          />
          <TextField
            label="パスワード"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            fullWidth
            disabled={isSubmitting}
            slotProps={{ htmlInput: { minLength: 8, maxLength: 128 } }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress color="inherit" size={18} /> : undefined}
          >
            {isSubmitting ? "ログイン中..." : "ログイン"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
