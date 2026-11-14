"use client";

import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";

import { useAuth } from "@/features/store-wallet/auth/auth-provider";
import { AdminNav } from "@/features/store-wallet/ui/admin-nav";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const { session, signOut } = useAuth();

  return (
    <Box
      sx={{
        minHeight: "100vh",
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        sx={{
          minHeight: "100vh",
        }}
      >
        <Box
          component="aside"
          sx={{
            width: { xs: "100%", lg: 250 },
            flexShrink: 0,
            p: 2,
            borderRight: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, px: 1.25, pb: 2 }}>
            TeraiD Pay Admin
          </Typography>
          <AdminNav />
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1.25} sx={{ px: 1.25 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {session?.storeManager.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                店舗 ID: {session?.storeManager.store_id}
              </Typography>
            </Box>
            <Button
              onClick={signOut}
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<LogoutRoundedIcon />}
              sx={{ justifyContent: "flex-start" }}
            >
              ログアウト
            </Button>
          </Stack>
        </Box>

        <Box
          component="section"
          sx={{
            flex: 1,
            minWidth: 0,
            p: { xs: 2, md: 3 },
            bgcolor: "background.paper",
          }}
        >
          {children}
        </Box>
      </Stack>
    </Box>
  );
}
