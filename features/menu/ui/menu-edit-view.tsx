"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Alert, Button, Stack } from "@mui/material";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";

import { MenuCreateView } from "@/features/menu/ui/menu-create-view";

export function MenuEditView() {
  const searchParams = useSearchParams();
  const menuItemIdParam = searchParams.get("id");
  const menuItemId = Number(menuItemIdParam);
  const isValidMenuItemId =
    menuItemIdParam !== null &&
    menuItemIdParam !== "" &&
    Number.isInteger(menuItemId) &&
    menuItemId >= 1;

  if (!isValidMenuItemId) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">編集対象のメニューIDが正しくありません。</Alert>
        <Button
          component={NextLink}
          href="/menus"
          startIcon={<ArrowBackRoundedIcon />}
          sx={{ alignSelf: "flex-start" }}
        >
          メニュー一覧へ戻る
        </Button>
      </Stack>
    );
  }

  return <MenuCreateView menuItemId={menuItemId} />;
}
