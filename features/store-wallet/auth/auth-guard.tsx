"use client";

import { Box, CircularProgress, Stack, Typography } from "@mui/material";

import { useAuth } from "@/features/store-wallet/auth/auth-provider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isReady } = useAuth();

  if (!isReady || !session) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <CircularProgress size={34} />
          <Typography color="text.secondary">認証情報を確認しています...</Typography>
        </Stack>
      </Box>
    );
  }

  return children;
}
