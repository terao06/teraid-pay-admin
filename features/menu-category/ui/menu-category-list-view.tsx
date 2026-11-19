"use client";

import { useEffect, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  LinearProgress,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { deleteMenuCategory, fetchMenuCategories } from "@/features/menu-category/api/client";
import type {
  MenuCategory,
  MenuCategoryPagination,
} from "@/features/menu-category/domain/types";
import { readClientError } from "@/lib/store-api-client";

type CategoryStatus = "active" | "inactive";

const CATEGORY_PAGE_SIZE = 15;
const INITIAL_PAGINATION: MenuCategoryPagination = {
  page: 1,
  page_size: CATEGORY_PAGE_SIZE,
  total: 0,
  total_pages: 0,
};

function TableLoadingRows() {
  return Array.from({ length: 6 }, (_, index) => (
    <TableRow key={index}>
      <TableCell><Skeleton width={34} /></TableCell>
      <TableCell><Skeleton width={index % 2 === 0 ? "58%" : "42%"} /></TableCell>
      <TableCell><Skeleton width={78} height={32} /></TableCell>
      <TableCell align="right"><Skeleton width={38} sx={{ ml: "auto" }} /></TableCell>
      <TableCell align="right"><Skeleton width={30} sx={{ ml: "auto" }} /></TableCell>
    </TableRow>
  ));
}

function StatusChip({ isActive }: { isActive: boolean }) {
  return (
    <Chip
      size="small"
      icon={isActive ? <CheckCircleRoundedIcon /> : <VisibilityOffRoundedIcon />}
      label={isActive ? "有効" : "無効"}
      sx={{
        minWidth: 78,
        justifyContent: "flex-start",
        fontWeight: 800,
        color: isActive ? "#0d6f52" : "#596579",
        bgcolor: isActive ? "#e9f8f2" : "#eef1f5",
        border: "1px solid",
        borderColor: isActive ? "rgba(13,124,90,0.16)" : "rgba(89,101,121,0.12)",
        "& .MuiChip-icon": {
          color: isActive ? "#18a97b" : "#7b8798",
        },
      }}
    />
  );
}

export function MenuCategoryListView() {
  const router = useRouter();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [pagination, setPagination] = useState<MenuCategoryPagination>(INITIAL_PAGINATION);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<CategoryStatus>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<MenuCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isActive = true;
    const normalizedName = searchQuery.trim();

    async function loadCategories() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await fetchMenuCategories({
          name: normalizedName || undefined,
          is_active: status === "active",
          page,
          page_size: CATEGORY_PAGE_SIZE,
        });

        if (!isActive) {
          return;
        }

        const lastPage = Math.max(1, result.data.pagination.total_pages);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }

        setCategories(result.data.menu_categories);
        setPagination(result.data.pagination);
        setIsLoading(false);
      } catch (error) {
        if (isActive) {
          setErrorMessage(readClientError(error, "カテゴリーの取得に失敗しました。"));
          setIsLoading(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      void loadCategories();
    }, normalizedName ? 350 : 0);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [page, reloadKey, searchQuery, status]);

  const firstItem = pagination.total === 0 ? 0 : (pagination.page - 1) * CATEGORY_PAGE_SIZE + 1;
  const lastItem = Math.min(pagination.page * CATEGORY_PAGE_SIZE, pagination.total);
  const hasSearchQuery = searchQuery.trim().length > 0;

  function changeStatus(nextStatus: CategoryStatus) {
    setStatus(nextStatus);
    setPage(1);
  }

  function closeDeleteDialog() {
    if (!isDeleting) {
      setCategoryToDelete(null);
    }
  }

  async function handleDeleteCategory() {
    if (!categoryToDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteErrorMessage(null);
    setSuccessMessage(null);

    try {
      await deleteMenuCategory(categoryToDelete.menu_category_id);
      setCategoryToDelete(null);
      setSuccessMessage(`「${categoryToDelete.name}」を削除しました。`);
      setIsLoading(true);
      setReloadKey((current) => current + 1);
    } catch (error) {
      setDeleteErrorMessage(readClientError(error, "カテゴリーの削除に失敗しました。"));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "flex-end" } }}
      >
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.14em" }}>
            CATEGORY MANAGEMENT
          </Typography>
          <Typography variant="h4">カテゴリー一覧</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            メニューを整理するカテゴリーと表示順を、ひと目で確認できます。
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.25}>
          <Tooltip title="最新の一覧を取得">
            <span>
              <Button
                variant="outlined"
                startIcon={<AutorenewRoundedIcon />}
                onClick={() => setReloadKey((current) => current + 1)}
                disabled={isLoading}
              >
                更新
              </Button>
            </span>
          </Tooltip>
          <Button
            component={NextLink}
            href="/menu-categories/new"
            variant="contained"
            startIcon={<AddRoundedIcon />}
          >
            新規登録
          </Button>
        </Stack>
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 2.5 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(280px, 1fr) auto" },
          gap: 2,
          alignItems: "center",
        }}
      >
        <TextField
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setPage(1);
          }}
          placeholder="カテゴリー名で検索"
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: hasSearchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label="検索キーワードを消去"
                    onClick={() => {
                      setSearchQuery("");
                      setPage(1);
                    }}
                  >
                    <ClearRoundedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
            htmlInput: { "aria-label": "カテゴリー名で検索", maxLength: 100 },
          }}
        />
        <ButtonGroup aria-label="カテゴリーの状態" sx={{ justifySelf: { md: "end" } }}>
          <Button
            variant={status === "active" ? "contained" : "outlined"}
            startIcon={<CheckCircleRoundedIcon />}
            onClick={() => changeStatus("active")}
            aria-pressed={status === "active"}
          >
            有効
          </Button>
          <Button
            variant={status === "inactive" ? "contained" : "outlined"}
            color={status === "inactive" ? "secondary" : "primary"}
            startIcon={<VisibilityOffRoundedIcon />}
            onClick={() => changeStatus("inactive")}
            aria-pressed={status === "inactive"}
          >
            無効
          </Button>
        </ButtonGroup>
      </Paper>

      {errorMessage ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => setReloadKey((current) => current + 1)}>
              再試行
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      ) : null}

      {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        <Box
          sx={{
            minHeight: 4,
            bgcolor: "transparent",
          }}
        >
          {isLoading && categories.length > 0 ? <LinearProgress /> : null}
        </Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ px: { xs: 2, md: 2.5 }, py: 2, justifyContent: "space-between", alignItems: { sm: "center" } }}
        >
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                display: "grid",
                placeItems: "center",
                borderRadius: 2,
                color: "primary.dark",
                bgcolor: "#e9f8f2",
              }}
            >
              <CategoryRoundedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 850, lineHeight: 1.25 }}>
                {status === "active" ? "有効なカテゴリー" : "無効なカテゴリー"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isLoading && categories.length === 0
                  ? "読み込み中…"
                  : `${pagination.total.toLocaleString("ja-JP")}件中 ${firstItem}〜${lastItem}件`}
              </Typography>
            </Box>
          </Stack>
          <Chip
            size="small"
            label={`${pagination.total.toLocaleString("ja-JP")} 件`}
            sx={{ alignSelf: { xs: "flex-start", sm: "center" }, fontWeight: 800 }}
          />
        </Stack>

        <TableContainer sx={{ borderTop: "1px solid", borderColor: "divider" }}>
          <Table sx={{ minWidth: 620 }} aria-label="カテゴリー一覧">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                <TableCell sx={{ width: 72, color: "text.secondary", fontWeight: 800 }}>順序</TableCell>
                <TableCell sx={{ color: "text.secondary", fontWeight: 800 }}>カテゴリー名</TableCell>
                <TableCell sx={{ width: 120, color: "text.secondary", fontWeight: 800 }}>状態</TableCell>
                <TableCell align="right" sx={{ width: 110, color: "text.secondary", fontWeight: 800 }}>
                  表示順
                </TableCell>
                <TableCell align="right" sx={{ width: 72, color: "text.secondary", fontWeight: 800 }}>
                  操作
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && categories.length === 0 ? <TableLoadingRows /> : null}
              {!isLoading && !errorMessage && categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 8, borderBottom: 0 }}>
                    <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center" }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          display: "grid",
                          placeItems: "center",
                          borderRadius: "50%",
                          color: "text.disabled",
                          bgcolor: "#f0f3f7",
                        }}
                      >
                        <CategoryRoundedIcon />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                          {hasSearchQuery ? "一致するカテゴリーがありません" : "カテゴリーはありません"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {hasSearchQuery
                            ? "検索キーワードを変えて、もう一度お試しください。"
                            : status === "active"
                              ? "有効なカテゴリーが登録されると、ここに表示されます。"
                              : "無効にしたカテゴリーが、ここに表示されます。"}
                        </Typography>
                      </Box>
                      {hasSearchQuery ? (
                        <Button variant="text" onClick={() => setSearchQuery("")}>
                          検索をクリア
                        </Button>
                      ) : null}
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : null}
              {!errorMessage
                ? categories.map((category, index) => (
                    <TableRow
                      key={category.menu_category_id}
                      hover
                      role="link"
                      tabIndex={0}
                      aria-label={`${category.name}の詳細を表示`}
                      onClick={() => router.push(`/menu-categories/edit?id=${category.menu_category_id}`)}
                      onKeyDown={(event) => {
                        if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                          event.preventDefault();
                          router.push(`/menu-categories/edit?id=${category.menu_category_id}`);
                        }
                      }}
                      sx={{
                        cursor: "pointer",
                        "&:last-child td": { borderBottom: pagination.total_pages <= 1 ? 0 : undefined },
                        "&:hover": { bgcolor: "rgba(24,169,123,0.035)" },
                        "&:focus-visible": {
                          outline: "3px solid rgba(24,169,123,0.22)",
                          outlineOffset: -3,
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
                          {(pagination.page - 1) * CATEGORY_PAGE_SIZE + index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 750, color: "text.primary" }}>
                          {category.name}
                        </Typography>
                      </TableCell>
                      <TableCell><StatusChip isActive={category.is_active} /></TableCell>
                      <TableCell align="right">
                        <Typography component="span" variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                          {category.display_order}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={`${category.name}を削除`}
                          disabled={isLoading || isDeleting}
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteErrorMessage(null);
                            setCategoryToDelete(category);
                          }}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>
        </TableContainer>

        {pagination.total_pages > 1 ? (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ px: { xs: 2, md: 2.5 }, py: 2, alignItems: "center", justifyContent: "space-between", borderTop: "1px solid", borderColor: "divider" }}
          >
            <Typography variant="caption" color="text.secondary">
              {pagination.total_pages}ページ中 {pagination.page}ページ
            </Typography>
            <Pagination
              page={pagination.page}
              count={pagination.total_pages}
              onChange={(_, nextPage) => setPage(nextPage)}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
              disabled={isLoading}
              getItemAriaLabel={(type, itemPage) => {
                if (type === "page") return `${itemPage}ページへ移動`;
                if (type === "first") return "最初のページへ移動";
                if (type === "last") return "最後のページへ移動";
                if (type === "next") return "次のページへ移動";
                return "前のページへ移動";
              }}
            />
          </Stack>
        ) : null}
      </Paper>

      <Dialog
        open={categoryToDelete !== null}
        onClose={closeDeleteDialog}
        fullWidth
        maxWidth="xs"
        aria-labelledby="menu-category-delete-dialog-title"
        aria-describedby="menu-category-delete-dialog-description"
      >
        <DialogTitle id="menu-category-delete-dialog-title">カテゴリーを削除しますか？</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            <DialogContentText id="menu-category-delete-dialog-description">
              「{categoryToDelete?.name}」を削除します。
              <br />
              この操作は取り消せません。
            </DialogContentText>
            {deleteErrorMessage ? <Alert severity="error">{deleteErrorMessage}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={isDeleting} autoFocus>
            キャンセル
          </Button>
          <Button
            onClick={handleDeleteCategory}
            color="error"
            variant="contained"
            loading={isDeleting}
          >
            {isDeleting ? "削除中…" : "削除する"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
