"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import NextLink from "next/link";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";

export function MenuListView() {
  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
      >
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.14em" }}>
            MENU MANAGEMENT
          </Typography>
          <Typography variant="h4">メニュー一覧</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            店舗で販売するメニューを管理します。
          </Typography>
        </Box>
        <Button component={NextLink} href="/menus/new" variant="contained" startIcon={<AddRoundedIcon />}>
          新規登録
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ minHeight: 360, p: 4, display: "grid", placeItems: "center" }}>
        <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center", maxWidth: 420 }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              display: "grid",
              placeItems: "center",
              borderRadius: 4,
              bgcolor: "#eef9f5",
              color: "primary.main",
            }}
          >
            <RestaurantMenuRoundedIcon sx={{ fontSize: 34 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              メニュー一覧は準備中です
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              一覧取得APIの追加後、この画面に登録済みメニューを表示します。
            </Typography>
          </Box>
          <Button component={NextLink} href="/menus/new" variant="outlined" startIcon={<AddRoundedIcon />}>
            最初のメニューを登録
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
