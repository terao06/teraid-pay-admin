"use client";

import { useState } from "react";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import WalletRoundedIcon from "@mui/icons-material/WalletRounded";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { usePathname } from "next/navigation";

import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { useAuth } from "@/features/auth/ui/auth-provider";
import { AdminNav } from "@/features/admin/ui/admin-nav";
import { readClientError } from "@/lib/store-api-client";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const { session, signOut } = useAuth();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const pageTitle = pathname === "/devices/new"
    ? "デバイス新規登録"
    : pathname === "/devices/edit"
      ? "デバイス編集"
    : pathname.startsWith("/devices")
      ? "デバイス管理"
    : pathname === "/menu-categories/new"
    ? "カテゴリー新規登録"
    : pathname.startsWith("/menu-categories")
      ? "カテゴリー管理"
    : pathname === "/register"
    ? "ウォレット登録"
    : pathname === "/menus/new"
      ? "メニュー新規登録"
      : pathname === "/menus/edit"
        ? "メニュー編集"
      : pathname.startsWith("/menus")
        ? "メニュー管理"
        : pathname === "/orders"
          ? "オーダー管理"
          : "ウォレット管理";
  const pageDescription = pathname.startsWith("/devices")
    ? "店舗で利用するデバイスを管理します"
    : pathname.startsWith("/menus") || pathname.startsWith("/menu-categories")
      ? "メニューとカテゴリーを、わかりやすく管理します"
      : pathname === "/orders"
        ? "未提供の注文を受付順に確認"
        : "店舗ウォレットを安全に管理します";
  const managerInitial = session?.storeManager.name.trim().charAt(0).toUpperCase() || "A";

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setSignOutError(null);

    try {
      await signOut();
    } catch (error) {
      setSignOutError(readClientError(error, "ログアウトに失敗しました。"));
      setIsSigningOut(false);
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <FeedbackBanner
        message={signOutError}
        severity="error"
        onClose={() => setSignOutError(null)}
      />
      <Stack
        direction={{ xs: "column", lg: "row" }}
        sx={{ minHeight: "100vh" }}
      >
        <Box
          component="aside"
          sx={{
            width: { xs: "100%", lg: 272 },
            flexShrink: 0,
            p: { xs: 2, lg: 2.5 },
            bgcolor: "#111827",
            color: "#ffffff",
            position: { lg: "sticky" },
            top: 0,
            height: { lg: "100vh" },
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", px: 1, pb: 3 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                display: "grid",
                placeItems: "center",
                borderRadius: 2.5,
                bgcolor: "primary.main",
                boxShadow: "0 10px 24px rgba(24,169,123,0.3)",
              }}
            >
              <WalletRoundedIcon />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
                TeraiD Pay
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                Admin Console
              </Typography>
            </Box>
          </Stack>
          <Box sx={{ flex: 1 }}>
            <AdminNav />
          </Box>
          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.1)" }} />
          <Stack spacing={1.5} sx={{ px: 1 }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
              <Avatar sx={{ width: 38, height: 38, bgcolor: "rgba(255,255,255,0.12)", fontSize: 15 }}>
                {managerInitial}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                  {session?.storeManager.name}
                </Typography>
              </Box>
            </Stack>
            <Button
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
              color="inherit"
              size="small"
              startIcon={
                isSigningOut
                  ? <CircularProgress color="inherit" size={16} />
                  : <LogoutRoundedIcon />
              }
              sx={{ justifyContent: "flex-start", color: "rgba(255,255,255,0.66)", px: 1 }}
            >
              {isSigningOut ? "ログアウト中..." : "ログアウト"}
            </Button>
          </Stack>
        </Box>

        <Box component="main" sx={{ flex: 1, minWidth: 0, bgcolor: "background.default" }}>
          <Stack
            component="header"
            direction="row"
            sx={{
              height: 76,
              px: { xs: 2, md: 4 },
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "rgba(255,255,255,0.92)",
              borderBottom: "1px solid",
              borderColor: "divider",
              backdropFilter: "blur(14px)",
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                {pageTitle}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {pageDescription}
              </Typography>
            </Box>
            <Chip
              size="small"
              label={session?.storeManager.name ?? "管理者"}
              avatar={<Avatar>{managerInitial}</Avatar>}
              sx={{ bgcolor: "#eef9f5", color: "primary.dark", fontWeight: 700 }}
            />
          </Stack>
          <Box component="section" sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, mx: "auto" }}>
            {children}
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
