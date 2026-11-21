"use client";

import { useEffect, useRef, useState } from "react";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import { fetchUnservedOrders } from "@/features/order/api/client";
import type { OrderListEntry, OrderListResponse } from "@/features/order/domain/types";
import { readClientError } from "@/lib/store-api-client";

const orderDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const orderTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const orderGrid = {
  display: "grid",
  gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" },
  gap: { xs: 1.5, sm: 2.5 },
};

const quantityText = {
  flexShrink: 0,
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
};

function OrderItems({ items }: { items: OrderListEntry["items"] }) {
  if (items.length === 0) {
    return <Typography variant="body2" color="text.secondary">明細なし</Typography>;
  }

  return (
    <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {items.map((item, itemIndex) => (
        <Box
          component="li"
          key={itemIndex}
          sx={{ "& + &": { mt: 1.75, pt: 1.75, borderTop: "1px solid", borderColor: "divider" } }}
        >
          <Stack direction="row" spacing={1.25} sx={{ justifyContent: "space-between", alignItems: "start" }}>
            <Typography sx={{ fontWeight: 750, overflowWrap: "anywhere" }}>
              {item.menu_item_name}
            </Typography>
            <Typography
              component="span"
              variant="body2"
              sx={{
                ...quantityText,
                px: 1,
                py: 0.25,
                minWidth: 42,
                borderRadius: 1.5,
                bgcolor: "#e7f4ee",
                color: "#135a44",
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              × {item.quantity}
            </Typography>
          </Stack>
          {item.options.length > 0 && (
            <Stack
              component="ul"
              spacing={0.75}
              sx={{ listStyle: "none", m: 0, mt: 1, pl: 1.5, borderLeft: "2px solid #d8e9e1" }}
            >
              {item.options.map((option, optionIndex) => (
                <Stack
                  key={optionIndex}
                  component="li"
                  direction="row"
                  spacing={1}
                  sx={{ justifyContent: "space-between", color: "text.secondary" }}
                >
                  <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                    {option.option_group_name}：{option.option_name}
                  </Typography>
                  <Typography component="span" variant="body2" sx={{ ...quantityText, pr: 1 }}>
                    × {option.option_quantity}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>
      ))}
    </Box>
  );
}

function OrderCard({ order }: { order: OrderListEntry }) {
  const createdAt = new Date(order.created_at);
  const validDate = !Number.isNaN(createdAt.getTime());
  const orderHeadingId = `order-${order.menu_order_id}`;

  return (
    <Paper
      component="article"
      aria-labelledby={orderHeadingId}
      variant="outlined"
      sx={{ height: "100%", overflow: "hidden", boxShadow: "0 2px 8px rgba(23, 32, 51, 0.04)" }}
    >
      <Box
        component="header"
        sx={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          alignItems: "start",
          gap: { xs: 1, sm: 2 },
          px: { xs: 1.75, sm: 2.5 },
          py: { xs: 1.5, sm: 2 },
          bgcolor: "#f6f9f7",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack direction="row" spacing={1.25} useFlexGap sx={{ alignItems: "start" }}>
          <Box
            sx={{
              display: { xs: "none", sm: "grid" },
              placeItems: "center",
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: "#e7f4ee",
              color: "#135a44",
            }}
          >
            <PlaceOutlinedIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              id={orderHeadingId}
              component="h2"
              sx={{ fontSize: "1.125rem", fontWeight: 800, lineHeight: 1.3, overflowWrap: "anywhere" }}
            >
              {order.device_name ?? "端末不明"}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
              注文 #{order.menu_order_id}
            </Typography>
          </Box>
        </Stack>
        <Box component="time" dateTime={order.created_at} sx={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
          <Typography
            component="span"
            sx={{ display: "block", fontSize: "1.125rem", fontWeight: 800, lineHeight: 1.3 }}
          >
            {validDate ? orderTimeFormatter.format(createdAt) : "—"}
          </Typography>
          <Typography component="span" variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
            受付 {validDate ? orderDateFormatter.format(createdAt) : "日時不明"}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ px: { xs: 1.75, sm: 2.5 }, py: { xs: 1.75, sm: 2.25 } }}>
        <OrderItems items={order.items} />
      </Box>
    </Paper>
  );
}

type OrderListState =
  | { status: "loading" }
  | { status: "success"; data: OrderListResponse["data"] }
  | { status: "error"; message: string };

export function OrderListView() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [page, setPage] = useState(1);
  const [reloadCount, setReloadCount] = useState(0);
  const [state, setState] = useState<OrderListState>({ status: "loading" });
  const data = state.status === "success" ? state.data : null;
  const isLoading = state.status === "loading";
  const hasOptions = data?.orders.some((order) => order.items.some((item) => item.options.length > 0));

  useEffect(() => {
    const controller = new AbortController();

    async function loadOrders() {
      try {
        const { data } = await fetchUnservedOrders(page, controller.signal);
        if (controller.signal.aborted) {
          return;
        }

        const lastPage = Math.max(data.pagination.total_pages, 1);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }

        setState({ status: "success", data });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            message: readClientError(error, "時間をおいて、もう一度お試しください。"),
          });
        }
      }
    }

    void loadOrders();
    return () => controller.abort();
  }, [page, reloadCount]);

  function refreshOrders() {
    setState({ status: "loading" });
    setReloadCount((count) => count + 1);
  }

  function changePage(nextPage: number) {
    if (nextPage === page) {
      return;
    }

    setState({ status: "loading" });
    setPage(nextPage);
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: "start" });
  }

  return (
    <Stack spacing={{ xs: 2, sm: 3 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography
          ref={headingRef}
          component="h1"
          variant="h4"
          tabIndex={-1}
          sx={{ fontSize: { xs: "1.625rem", sm: "2.125rem" }, scrollMarginTop: "96px" }}
        >
          オーダー一覧
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshRoundedIcon />}
          disabled={isLoading}
          onClick={refreshOrders}
          sx={{
            flexShrink: 0,
            minHeight: 44,
            px: { xs: 1.25, sm: 2.25 },
            bgcolor: "#11634d",
            color: "#fff",
            "&:hover": { bgcolor: "#0b503d" },
          }}
        >
          {isLoading ? "取得中" : state.status === "error" ? "再試行" : "更新"}
        </Button>
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          flexWrap: "wrap",
          px: { xs: 1.75, sm: 2.5 },
          py: 1.5,
          bgcolor: "#eff8f3",
          borderColor: "#d9ebe1",
          boxShadow: "none",
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", color: "#135a44" }}>
          <ReceiptLongOutlinedIcon fontSize="small" />
          <Typography component="span" variant="body2" sx={{ fontWeight: 750 }}>未提供</Typography>
          {data && (
            <Typography
              component="span"
              sx={{ display: "inline-flex", alignItems: "baseline", gap: 0.5, lineHeight: 1 }}
            >
              <Box component="strong" sx={{ fontSize: "1.625rem", fontVariantNumeric: "tabular-nums" }}>
                {data.pagination.total.toLocaleString("ja-JP")}
              </Box>
              <Typography component="span" variant="body2">件</Typography>
            </Typography>
          )}
        </Stack>
        {data && data.orders.length > 0 && (
          <Box sx={{ textAlign: { sm: "right" } }}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", justifyContent: { sm: "end" } }}>
              <ScheduleRoundedIcon sx={{ fontSize: 17, color: "#135a44" }} />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>受付が早い順</Typography>
            </Stack>
            {hasOptions && (
              <Typography variant="caption" color="text.secondary">
                オプションの数量は商品1個当たり
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      {isLoading && (
        <Box role="status" aria-label="オーダー一覧を取得中" sx={orderGrid}>
          {[0, 1].map((placeholder) => (
            <Skeleton
              key={placeholder}
              variant="rounded"
              height={158}
              animation={false}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Box>
      )}

      {state.status === "error" && (
        <Alert severity="error" variant="outlined">
          <AlertTitle>オーダー一覧を取得できませんでした</AlertTitle>
          {state.message}
        </Alert>
      )}

      {data && (data.orders.length === 0 ? (
        <Paper
          role="status"
          variant="outlined"
          sx={{ py: { xs: 4, sm: 6 }, px: 2, textAlign: "center" }}
        >
          <Stack spacing={1.25} sx={{ alignItems: "center" }}>
            <CheckCircleOutlineRoundedIcon sx={{ color: "#135a44", fontSize: 36 }} />
            <Typography sx={{ fontWeight: 750 }}>未提供のオーダーはありません</Typography>
          </Stack>
        </Paper>
      ) : (
        <Box component="ul" aria-label="未提供のオーダー" sx={{ ...orderGrid, listStyle: "none", m: 0, p: 0 }}>
          {data.orders.map((order) => (
            <Box component="li" key={order.menu_order_id} sx={{ minWidth: 0 }}>
              <OrderCard order={order} />
            </Box>
          ))}
        </Box>
      ))}

      {data && data.pagination.total_pages > 1 && (
        <Paper
          variant="outlined"
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: { xs: "center", sm: "space-between" },
            gap: 1,
            px: { xs: 1, sm: 2 },
            py: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
            {(data.pagination.page - 1) * data.pagination.page_size + 1}〜
            {(data.pagination.page - 1) * data.pagination.page_size + data.orders.length}件を表示
          </Typography>
          <Pagination
            aria-label="オーダー一覧のページ移動"
            page={data.pagination.page}
            count={data.pagination.total_pages}
            onChange={(_, nextPage) => changePage(nextPage)}
            siblingCount={0}
            shape="rounded"
            getItemAriaLabel={(type, itemPage, selected) => {
              if (type === "previous") return "前のページ";
              if (type === "next") return "次のページ";
              return selected ? `${itemPage}ページ目（現在）` : `${itemPage}ページ目`;
            }}
            sx={{
              "& .MuiPaginationItem-root": { minWidth: { xs: 32, sm: 36 }, height: 40, mx: 0.25 },
              "& .MuiPaginationItem-root.Mui-selected": { bgcolor: "#e7f4ee", color: "#135a44", fontWeight: 800 },
            }}
          />
        </Paper>
      )}
    </Stack>
  );
}
