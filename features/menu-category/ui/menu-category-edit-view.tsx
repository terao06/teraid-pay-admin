"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Alert, Button, Stack } from "@mui/material";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";

import { MenuCategoryCreateView } from "@/features/menu-category/ui/menu-category-create-view";

export function MenuCategoryEditView() {
  const searchParams = useSearchParams();
  const menuCategoryIdParam = searchParams.get("id");
  const menuCategoryId = Number(menuCategoryIdParam);
  const isValidMenuCategoryId =
    menuCategoryIdParam !== null &&
    menuCategoryIdParam !== "" &&
    Number.isInteger(menuCategoryId) &&
    menuCategoryId >= 1;

  if (!isValidMenuCategoryId) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">編集するカテゴリーが正しくありません。</Alert>
        <Button
          component={NextLink}
          href="/menu-categories"
          startIcon={<ArrowBackRoundedIcon />}
          sx={{ alignSelf: "flex-start" }}
        >
          カテゴリー一覧へ戻る
        </Button>
      </Stack>
    );
  }

  return <MenuCategoryCreateView menuCategoryId={menuCategoryId} />;
}
