"use client";

import { useEffect, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import DevicesRoundedIcon from "@mui/icons-material/DevicesRounded";
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

import { fetchDevices } from "@/features/device/api/client";
import type {
  DeviceListItem,
  DevicePagination,
} from "@/features/device/domain/types";
import { readClientError } from "@/features/store-wallet/api/client";

type DeviceStatusFilter = "all" | "active" | "inactive";

const DEVICE_PAGE_SIZE = 20;
const INITIAL_PAGINATION: DevicePagination = {
  page: 1,
  page_size: DEVICE_PAGE_SIZE,
  total: 0,
  total_pages: 0,
};

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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

function TableLoadingRows() {
  return Array.from({ length: 6 }, (_, index) => (
    <TableRow key={index}>
      <TableCell><Skeleton width={34} /></TableCell>
      <TableCell><Skeleton width={index % 2 === 0 ? "55%" : "42%"} /></TableCell>
      <TableCell><Skeleton width={78} height={32} /></TableCell>
      <TableCell><Skeleton width={138} /></TableCell>
    </TableRow>
  ));
}

export function DeviceListView() {
  const router = useRouter();
  const [devices, setDevices] = useState<DeviceListItem[]>([]);
  const [pagination, setPagination] = useState<DevicePagination>(INITIAL_PAGINATION);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<DeviceStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isActive = true;
    const normalizedName = searchQuery.trim();

    async function loadDevices() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await fetchDevices({
          device_name: normalizedName || undefined,
          is_active: status === "all" ? undefined : status === "active",
          page,
          page_size: DEVICE_PAGE_SIZE,
        });

        if (!isActive) {
          return;
        }

        if (result.data.pagination.total_pages > 0 && page > result.data.pagination.total_pages) {
          setPage(result.data.pagination.total_pages);
          return;
        }

        setDevices(result.data.devices);
        setPagination(result.data.pagination);
      } catch (error) {
        if (isActive) {
          setErrorMessage(readClientError(error, "デバイスの取得に失敗しました。"));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      void loadDevices();
    }, normalizedName ? 350 : 0);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [page, reloadKey, searchQuery, status]);

  const hasSearchQuery = searchQuery.trim() !== "";
  const firstItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.page_size + 1;
  const lastItem = Math.min(pagination.page * pagination.page_size, pagination.total);

  function changeStatus(nextStatus: DeviceStatusFilter) {
    setStatus(nextStatus);
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
            DEVICE MANAGEMENT
          </Typography>
          <Typography variant="h4">デバイス一覧</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            店舗に登録されたデバイスと現在の利用状態を確認できます。
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
          <Button component={NextLink} href="/devices/new" variant="contained" startIcon={<AddRoundedIcon />}>
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
          placeholder="デバイス名で検索"
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
            htmlInput: { "aria-label": "デバイス名で検索", maxLength: 100 },
          }}
        />
        <ButtonGroup aria-label="デバイスの状態" sx={{ justifySelf: { md: "end" } }}>
          <Button
            variant={status === "all" ? "contained" : "outlined"}
            onClick={() => changeStatus("all")}
            aria-pressed={status === "all"}
          >
            すべて
          </Button>
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

      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        <Box sx={{ minHeight: 4 }}>
          {isLoading && devices.length > 0 ? <LinearProgress /> : null}
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
              <DevicesRoundedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 850, lineHeight: 1.25 }}>
                {status === "all" ? "登録デバイス" : status === "active" ? "有効なデバイス" : "無効なデバイス"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isLoading && devices.length === 0
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
          <Table sx={{ minWidth: 650 }} aria-label="デバイス一覧">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                <TableCell sx={{ width: 72, color: "text.secondary", fontWeight: 800 }}>No.</TableCell>
                <TableCell sx={{ color: "text.secondary", fontWeight: 800 }}>デバイス名</TableCell>
                <TableCell sx={{ width: 120, color: "text.secondary", fontWeight: 800 }}>状態</TableCell>
                <TableCell sx={{ width: 200, color: "text.secondary", fontWeight: 800 }}>登録日時</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && devices.length === 0 ? <TableLoadingRows /> : null}
              {!isLoading && !errorMessage && devices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ py: 8, borderBottom: 0 }}>
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
                        <DevicesRoundedIcon />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                          {hasSearchQuery ? "一致するデバイスがありません" : "デバイスはありません"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {hasSearchQuery
                            ? "検索キーワードを変えて、もう一度お試しください。"
                            : status === "all"
                              ? "デバイスが登録されると、ここに表示されます。"
                              : `${status === "active" ? "有効" : "無効"}なデバイスはありません。`}
                        </Typography>
                      </Box>
                      {hasSearchQuery ? (
                        <Button variant="text" onClick={() => setSearchQuery("")}>検索をクリア</Button>
                      ) : null}
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : null}
              {!errorMessage
                ? devices.map((device, index) => (
                    <TableRow
                      key={device.device_id}
                      hover
                      role="link"
                      tabIndex={0}
                      aria-label={`${device.device_name}の詳細を表示`}
                      onClick={() => router.push(`/devices/edit?id=${device.device_id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/devices/edit?id=${device.device_id}`);
                        }
                      }}
                      sx={{
                        cursor: "pointer",
                        "&:hover": { bgcolor: "rgba(24,169,123,0.035)" },
                        "&:focus-visible": {
                          outline: "3px solid rgba(24,169,123,0.22)",
                          outlineOffset: -3,
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
                          {(pagination.page - 1) * pagination.page_size + index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 750, color: "text.primary" }}>
                          {device.device_name}
                        </Typography>
                      </TableCell>
                      <TableCell><StatusChip isActive={device.is_active} /></TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
                          {formatCreatedAt(device.created_at)}
                        </Typography>
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
    </Stack>
  );
}
