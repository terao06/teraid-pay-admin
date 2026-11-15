"use client";

import { useEffect, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ImageNotSupportedRoundedIcon from "@mui/icons-material/ImageNotSupportedRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import NextLink from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem as SelectItem,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { fetchMenuCategories, fetchMenus } from "@/features/menu/api/client";
import type { MenuCategory, MenuItem, MenuPagination } from "@/features/menu/domain/types";
import { readClientError } from "@/features/store-wallet/api/client";

type AvailabilityFilter = "all" | "available" | "unavailable";

const MENU_PAGE_SIZE = 12;
const INITIAL_PAGINATION: MenuPagination = {
  page: 1,
  page_size: MENU_PAGE_SIZE,
  total: 0,
  total_pages: 0,
};

function formatPrice(price: string, tokenSymbol: string) {
  const value = Number(price);
  if (!Number.isFinite(value)) {
    return `${price} ${tokenSymbol}`;
  }

  return `${new Intl.NumberFormat("ja-JP", {
    maximumFractionDigits: 6,
  }).format(value)} ${tokenSymbol}`;
}

function MenuImage({ item }: { item: MenuItem }) {
  const [hasError, setHasError] = useState(false);

  return (
    <Box
      sx={{
        position: "relative",
        aspectRatio: "4 / 3",
        overflow: "hidden",
        bgcolor: "#edf2f6",
      }}
    >
      {hasError ? (
        <Stack
          spacing={1}
          sx={{ height: "100%", alignItems: "center", justifyContent: "center", color: "text.disabled" }}
        >
          <ImageNotSupportedRoundedIcon sx={{ fontSize: 38 }} />
          <Typography variant="caption">画像を表示できません</Typography>
        </Stack>
      ) : (
        <Box
          component="img"
          src={item.image_url}
          alt={`${item.name}の商品画像`}
          loading="lazy"
          onError={() => setHasError(true)}
          sx={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
        />
      )}
      <Chip
        size="small"
        icon={item.is_available ? <CheckCircleRoundedIcon /> : <VisibilityOffRoundedIcon />}
        label={item.is_available ? "販売中" : "非公開"}
        color={item.is_available ? "success" : "default"}
        sx={{
          position: "absolute",
          top: 12,
          right: 12,
          fontWeight: 800,
          color: item.is_available ? "#ffffff" : "#475569",
          bgcolor: item.is_available ? "rgba(13, 124, 90, 0.96)" : "rgba(255,255,255,0.96)",
          border: "1px solid",
          borderColor: item.is_available ? "rgba(255,255,255,0.34)" : "rgba(105,115,134,0.24)",
          boxShadow: item.is_available
            ? "0 6px 18px rgba(13, 124, 90, 0.28)"
            : "0 4px 14px rgba(23, 32, 51, 0.10)",
          backdropFilter: "blur(8px)",
          "& .MuiChip-icon": {
            color: item.is_available ? "#ffffff" : "#697386",
          },
        }}
      />
    </Box>
  );
}

function MenuCard({ item }: { item: MenuItem }) {
  return (
    <Paper
      component="article"
      variant="outlined"
      sx={{
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
        "&:hover": {
          transform: "translateY(-3px)",
          borderColor: "rgba(24, 169, 123, 0.38)",
          boxShadow: "0 18px 42px rgba(23, 32, 51, 0.10)",
        },
      }}
    >
      <MenuImage item={item} />
      <Stack spacing={1.5} sx={{ p: 2.25, flex: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Typography
            variant="caption"
            color="primary.dark"
            sx={{ fontWeight: 800, letterSpacing: "0.04em" }}
          >
            {item.menu_category_name ?? "未分類"}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            表示順 {item.display_order}
          </Typography>
        </Stack>
        <Box sx={{ minHeight: 70 }}>
          <Typography variant="h6" sx={{ fontWeight: 850, lineHeight: 1.35 }}>
            {item.name}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.75,
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
              lineHeight: 1.65,
            }}
          >
            {item.description?.trim() || "説明は登録されていません"}
          </Typography>
        </Box>
        <Stack
          direction="row"
          spacing={1}
          sx={{ pt: 1.5, mt: "auto", borderTop: "1px solid", borderColor: "divider", alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography variant="h6" color="primary.dark" sx={{ fontWeight: 900 }}>
            {formatPrice(item.price, item.token_symbol)}
          </Typography>
          <Button
            component={NextLink}
            href={`/menus/edit?id=${item.menu_item_id}`}
            size="small"
            variant="outlined"
            startIcon={<EditRoundedIcon />}
          >
            編集
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function MenuCardSkeleton() {
  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Skeleton variant="rectangular" sx={{ aspectRatio: "4 / 3", height: "auto" }} />
      <Stack spacing={1.5} sx={{ p: 2.25 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Skeleton width="32%" />
          <Skeleton width="22%" />
        </Stack>
        <Skeleton width="72%" height={32} />
        <Skeleton />
        <Skeleton width="82%" />
        <Skeleton width="46%" height={34} />
      </Stack>
    </Paper>
  );
}

export function MenuListView() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<MenuCategory[]>([]);
  const [pagination, setPagination] = useState<MenuPagination>(INITIAL_PAGINATION);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");

  useEffect(() => {
    let isActive = true;

    void fetchMenuCategories()
      .then((result) => {
        if (isActive) {
          setCategoryOptions(result.data.menu_categories);
        }
      })
      .catch(() => {
        // 一覧表示を優先し、カテゴリー取得失敗時は絞り込み候補のみ空にする。
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    const normalizedName = searchQuery.trim();

    async function loadMenus() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await fetchMenus({
          name: normalizedName || undefined,
          menu_category_id:
            category === "all" || category === "uncategorized"
              ? undefined
              : Number(category),
          is_available:
            availability === "all" ? undefined : availability === "available",
          page,
          page_size: MENU_PAGE_SIZE,
        });
        if (isActive) {
          if (
            result.data.pagination.total_pages > 0 &&
            page > result.data.pagination.total_pages
          ) {
            setPage(result.data.pagination.total_pages);
            return;
          }
          setMenus(result.data.menu_items);
          setPagination(result.data.pagination);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(readClientError(error, "メニューの取得に失敗しました。"));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      void loadMenus();
    }, normalizedName ? 350 : 0);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [availability, category, page, reloadKey, searchQuery]);

  const filteredMenus = menus;

  const availableCount = menus.filter((item) => item.is_available).length;
  const unavailableCount = menus.length - availableCount;
  const hasFilters = searchQuery.trim() !== "" || category !== "all" || availability !== "all";

  function clearFilters() {
    setSearchQuery("");
    setCategory("all");
    setAvailability("all");
    setPage(1);
  }

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
            店頭で販売する商品と公開状態を、ひと目で確認できます。
          </Typography>
        </Box>
        <Button component={NextLink} href="/menus/new" variant="contained" startIcon={<AddRoundedIcon />}>
          新規登録
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 1.5,
        }}
      >
        {[
          { label: hasFilters ? "検索結果" : "登録メニュー", value: pagination.total, color: "#172033", bg: "#ffffff" },
          { label: "このページの販売中", value: availableCount, color: "#0d7c5a", bg: "#eef9f5" },
          { label: "このページの非公開", value: unavailableCount, color: "#697386", bg: "#f0f2f6" },
        ].map((summary) => (
          <Paper key={summary.label} variant="outlined" sx={{ p: 2, bgcolor: summary.bg }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {summary.label}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.25, fontWeight: 900, color: summary.color }}>
              {isLoading && menus.length === 0 ? "—" : summary.value}
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                件
              </Typography>
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper variant="outlined" sx={{ position: "relative", overflow: "hidden" }}>
        {isLoading && menus.length > 0 ? <LinearProgress /> : null}
        <Box
          sx={{
            p: 2,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(280px, 1fr) 200px 180px auto" },
            gap: 1.5,
            alignItems: "center",
          }}
        >
          <TextField
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(1);
            }}
            placeholder="商品名・説明・カテゴリで検索"
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon color="action" />
                  </InputAdornment>
                ),
              },
              htmlInput: { "aria-label": "メニューを検索", maxLength: 255 },
            }}
          />
          <FormControl size="small">
            <InputLabel id="menu-category-filter-label">カテゴリ</InputLabel>
            <Select
              labelId="menu-category-filter-label"
              value={category}
              label="カテゴリ"
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
            >
              <SelectItem value="all">すべてのカテゴリ</SelectItem>
              {categoryOptions.map((item) => (
                <SelectItem key={item.menu_category_id} value={String(item.menu_category_id)}>
                  {item.name}
                </SelectItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel id="menu-availability-filter-label">公開状態</InputLabel>
            <Select
              labelId="menu-availability-filter-label"
              value={availability}
              label="公開状態"
              onChange={(event) => {
                setAvailability(event.target.value as AvailabilityFilter);
                setPage(1);
              }}
            >
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="available">販売中</SelectItem>
              <SelectItem value="unavailable">非公開</SelectItem>
            </Select>
          </FormControl>
          <Tooltip title="一覧を更新">
            <span>
              <IconButton
                aria-label="メニュー一覧を更新"
                onClick={() => setReloadKey((current) => current + 1)}
                disabled={isLoading}
              >
                <AutorenewRoundedIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
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

      {!errorMessage ? (
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.secondary">
              {isLoading && menus.length === 0
                ? "メニューを読み込んでいます"
                : pagination.total === 0
                  ? "0件を表示"
                  : `全${pagination.total}件中 ${(pagination.page - 1) * pagination.page_size + 1}〜${Math.min(pagination.page * pagination.page_size, pagination.total)}件を表示`}
            </Typography>
            {hasFilters ? (
              <Button size="small" color="inherit" onClick={clearFilters}>
                条件をリセット
              </Button>
            ) : null}
          </Stack>

          {isLoading && menus.length === 0 ? (
            <Box
              aria-label="メニューを読み込み中"
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                gap: 2,
              }}
            >
              {Array.from({ length: 6 }, (_, index) => <MenuCardSkeleton key={index} />)}
            </Box>
          ) : filteredMenus.length > 0 ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
                gap: 2,
              }}
            >
              {filteredMenus.map((item) => <MenuCard key={item.menu_item_id} item={item} />)}
            </Box>
          ) : (
            <Paper variant="outlined" sx={{ minHeight: 340, p: 4, display: "grid", placeItems: "center" }}>
              <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center", maxWidth: 440 }}>
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
                  {hasFilters ? <SearchRoundedIcon sx={{ fontSize: 34 }} /> : <RestaurantMenuRoundedIcon sx={{ fontSize: 34 }} />}
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 850 }}>
                    {hasFilters ? "条件に一致するメニューがありません" : "メニューはまだ登録されていません"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.7 }}>
                    {hasFilters
                      ? "検索キーワードや絞り込み条件を変更して、もう一度お試しください。"
                      : "最初の商品を登録すると、販売状態や価格をここでまとめて確認できます。"}
                  </Typography>
                </Box>
                {hasFilters ? (
                  <Button variant="outlined" onClick={clearFilters}>絞り込みを解除</Button>
                ) : (
                  <Button component={NextLink} href="/menus/new" variant="outlined" startIcon={<AddRoundedIcon />}>
                    最初のメニューを登録
                  </Button>
                )}
              </Stack>
            </Paper>
          )}

          {pagination.total_pages > 1 && filteredMenus.length > 0 ? (
            <Stack sx={{ pt: 2, alignItems: "center" }}>
              <Pagination
                page={pagination.page}
                count={pagination.total_pages}
                onChange={(_, nextPage) => {
                  setPage(nextPage);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
                disabled={isLoading}
                aria-label="メニュー一覧のページ移動"
              />
            </Stack>
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );
}
