"use client";

import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import NextLink from "next/link";
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import {
  createMenu,
  fetchMenu,
  fetchMenuCategories,
  updateMenu,
  updateMenuOptionGroups,
} from "@/features/menu/api/client";
import type {
  MenuCategory,
  MenuCreateRequest,
  MenuOptionGroup,
  MenuOptionGroupsUpdateRequest,
  MenuUpdateRequest,
} from "@/features/menu/domain/types";
import { readClientError } from "@/features/store-wallet/api/client";
import { FeedbackBanner } from "@/features/store-wallet/ui/feedback-banner";
import { LoadingOverlay } from "@/features/store-wallet/ui/loading-overlay";

interface MenuImageDraft {
  base64: string;
  dataUrl: string;
  extension: "jpeg" | "jpg" | "png";
  fileName: string;
}

interface ImageCropSettings {
  zoom: number;
  positionX: number;
  positionY: number;
}

interface OptionDraft {
  id: string;
  menuOptionId?: number;
  name: string;
  additionalPrice: string;
  displayOrder: number;
  isAvailable: boolean;
}

interface OptionGroupDraft {
  id: string;
  menuOptionGroupId?: number;
  name: string;
  minSelections: number;
  maxSelections: number;
  displayOrder: number;
  isActive: boolean;
  options: OptionDraft[];
}

function createDraftId() {
  return crypto.randomUUID();
}

function createOption(displayOrder: number): OptionDraft {
  return {
    id: createDraftId(),
    name: "",
    additionalPrice: "0",
    displayOrder,
    isAvailable: true,
  };
}

function createOptionGroupDrafts(optionGroups: MenuOptionGroup[]): OptionGroupDraft[] {
  return optionGroups.map((group) => ({
    id: String(group.menu_option_group_id),
    menuOptionGroupId: group.menu_option_group_id,
    name: group.name,
    minSelections: group.min_selections,
    maxSelections: group.max_selections,
    displayOrder: group.display_order,
    isActive: group.is_active,
    options: group.options.map((option) => ({
      id: String(option.menu_option_id),
      menuOptionId: option.menu_option_id,
      name: option.name,
      additionalPrice: option.additional_price,
      displayOrder: option.display_order,
      isAvailable: option.is_available,
    })),
  }));
}

function readImage(file: File): Promise<MenuImageDraft> {
  return new Promise((resolve, reject) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "png" && extension !== "jpg" && extension !== "jpeg") {
      reject(new Error("PNG、JPG、JPEG形式の画像を選択してください。"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("画像を読み込めませんでした。"));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("画像を読み込めませんでした。"));
        return;
      }
      const [, base64] = reader.result.split(",", 2);
      if (!base64) {
        reject(new Error("画像データを変換できませんでした。"));
        return;
      }
      resolve({ base64, dataUrl: reader.result, extension, fileName: file.name });
    };
    reader.readAsDataURL(file);
  });
}

function createCroppedImageDataUrl(
  image: MenuImageDraft,
  crop: ImageCropSettings,
  outputWidth: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const source = new window.Image();
    source.onerror = () => reject(new Error("画像の切り抜き処理に失敗しました。"));
    source.onload = () => {
      const outputHeight = Math.round((outputWidth * 3) / 4);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("画像の切り抜き処理に失敗しました。"));
        return;
      }

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const coverScale = Math.max(
        outputWidth / source.naturalWidth,
        outputHeight / source.naturalHeight,
      );
      const scale = coverScale * crop.zoom;
      const drawWidth = source.naturalWidth * scale;
      const drawHeight = source.naturalHeight * scale;
      const drawX =
        drawWidth >= outputWidth
          ? -(drawWidth - outputWidth) * (crop.positionX / 100)
          : (outputWidth - drawWidth) * (crop.positionX / 100);
      const drawY =
        drawHeight >= outputHeight
          ? -(drawHeight - outputHeight) * (crop.positionY / 100)
          : (outputHeight - drawHeight) * (crop.positionY / 100);

      context.fillStyle = "#eef2f6";
      context.fillRect(0, 0, outputWidth, outputHeight);
      context.drawImage(source, drawX, drawY, drawWidth, drawHeight);

      const mimeType = image.extension === "png" ? "image/png" : "image/jpeg";
      resolve(canvas.toDataURL(mimeType, 0.9));
    };
    source.src = image.dataUrl;
  });
}

interface MenuCreateViewProps {
  menuItemId?: number;
}

export function MenuCreateView({ menuItemId }: MenuCreateViewProps = {}) {
  const isEditMode = menuItemId !== undefined;
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingMenu, setIsLoadingMenu] = useState(isEditMode);
  const [hasLoadedMenu, setHasLoadedMenu] = useState(!isEditMode);
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isAvailable, setIsAvailable] = useState(true);
  const [image, setImage] = useState<MenuImageDraft | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageCrop, setImageCrop] = useState<ImageCropSettings>({
    zoom: 1,
    positionX: 50,
    positionY: 50,
  });
  const [croppedImagePreview, setCroppedImagePreview] = useState<string | null>(null);
  const [optionGroups, setOptionGroups] = useState<OptionGroupDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewDrawerOpen, setIsPreviewDrawerOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    async function loadCategories() {
      try {
        const result = await fetchMenuCategories();
        if (isActive) {
          setCategories(result.data.menu_categories);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(readClientError(error, "カテゴリーの取得に失敗しました。"));
        }
      } finally {
        if (isActive) {
          setIsLoadingCategories(false);
        }
      }
    }
    void loadCategories();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (menuItemId === undefined) return;

    let isActive = true;

    async function loadMenu() {
      setIsLoadingMenu(true);
      setHasLoadedMenu(false);
      try {
        const result = await fetchMenu(menuItemId as number);
        if (!isActive) return;

        const menu = result.data;
        setCategoryId(menu.menu_category_id === null ? "" : String(menu.menu_category_id));
        setName(menu.name);
        setDescription(menu.description ?? "");
        setPrice(menu.price);
        setDisplayOrder(menu.display_order);
        setIsAvailable(menu.is_available);
        setExistingImageUrl(menu.image_url);
        setImage(null);
        setOptionGroups(createOptionGroupDrafts(menu.option_groups));
        setHasLoadedMenu(true);
      } catch (error) {
        if (isActive) {
          setErrorMessage(readClientError(error, "メニューの取得に失敗しました。"));
        }
      } finally {
        if (isActive) {
          setIsLoadingMenu(false);
        }
      }
    }

    void loadMenu();
    return () => {
      isActive = false;
    };
  }, [menuItemId]);

  useEffect(() => {
    let isActive = true;
    if (!image) {
      return () => {
        isActive = false;
      };
    }

    void createCroppedImageDataUrl(image, imageCrop, 640)
      .then((dataUrl) => {
        if (isActive) {
          setCroppedImagePreview(dataUrl);
        }
      })
      .catch(() => {
        if (isActive) {
          setCroppedImagePreview(null);
        }
      });

    return () => {
      isActive = false;
    };
  }, [image, imageCrop]);

  function closeFeedback() {
    setStatusMessage(null);
    setErrorMessage(null);
  }

  function resetForm() {
    setCategoryId("");
    setName("");
    setDescription("");
    setPrice("");
    setDisplayOrder(0);
    setIsAvailable(true);
    setImage(null);
    setExistingImageUrl(null);
    setImageCrop({ zoom: 1, positionX: 50, positionY: 50 });
    setCroppedImagePreview(null);
    setOptionGroups([]);
    setIsPreviewDrawerOpen(false);
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      setCroppedImagePreview(null);
      setImage(await readImage(file));
      setImageCrop({ zoom: 1, positionX: 50, positionY: 50 });
      setErrorMessage(null);
    } catch (error) {
      setImage(null);
      setErrorMessage(readClientError(error, "画像を読み込めませんでした。"));
    } finally {
      event.target.value = "";
    }
  }

  function addOptionGroup() {
    setOptionGroups((current) => [
      ...current,
      {
        id: createDraftId(),
        name: "",
        minSelections: 0,
        maxSelections: 1,
        displayOrder: current.length + 1,
        isActive: true,
        options: [createOption(1)],
      },
    ]);
  }

  function updateGroup(groupId: string, patch: Partial<OptionGroupDraft>) {
    setOptionGroups((current) =>
      current.map((group) => (group.id === groupId ? { ...group, ...patch } : group)),
    );
  }

  function updateOption(groupId: string, optionId: string, patch: Partial<OptionDraft>) {
    setOptionGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.map((option) =>
                option.id === optionId ? { ...option, ...patch } : option,
              ),
            }
          : group,
      ),
    );
  }

  function addOption(groupId: string) {
    setOptionGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, options: [...group.options, createOption(group.options.length + 1)] }
          : group,
      ),
    );
  }

  function validateForm() {
    if (!name.trim()) return "メニュー名を入力してください。";
    if (price === "" || Number(price) < 0) return "0以上の価格を入力してください。";
    if (!image && !existingImageUrl) return "メニュー画像を選択してください。";
    for (const group of optionGroups) {
      if (!group.name.trim()) return "選択項目の名前を入力してください。";
      if (group.minSelections > group.maxSelections) {
        return `「${group.name}」の最小選択数は最大選択数以下にしてください。`;
      }
      if (group.options.some((option) => !option.name.trim())) {
        return `「${group.name}」の選択肢を入力してください。`;
      }
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationMessage = validateForm();
    if (validationMessage || (isEditMode && !hasLoadedMenu) || (!isEditMode && !image)) {
      setErrorMessage(validationMessage ?? "入力内容を確認してください。");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      if (isEditMode) {
        const payload: MenuUpdateRequest = {
          menu_category_id: categoryId ? Number(categoryId) : null,
          name: name.trim(),
          description: description.trim() || null,
          price,
          token_symbol: "JPYC",
          is_available: isAvailable,
          display_order: displayOrder,
        };

        if (image) {
          const croppedDataUrl = await createCroppedImageDataUrl(image, imageCrop, 1200);
          const [, croppedBase64] = croppedDataUrl.split(",", 2);
          if (!croppedBase64) {
            throw new Error("画像データを変換できませんでした。");
          }
          payload.menu_image = croppedBase64;
          payload.image_extension = image.extension;
        }

        const optionGroupsPayload: MenuOptionGroupsUpdateRequest = {
          option_groups: optionGroups.map((group) => ({
            menu_option_group_id: group.menuOptionGroupId,
            name: group.name.trim(),
            min_selections: group.minSelections,
            max_selections: group.maxSelections,
            display_order: group.displayOrder,
            is_active: group.isActive,
            options: group.options.map((option) => ({
              menu_option_id: option.menuOptionId,
              name: option.name.trim(),
              additional_price: option.additionalPrice || "0",
              display_order: option.displayOrder,
              is_available: option.isAvailable,
            })),
          })),
        };

        const result = await updateMenu(menuItemId as number, payload);
        await updateMenuOptionGroups(result.data.menu_item_id, optionGroupsPayload);
        const refreshedResult = await fetchMenu(result.data.menu_item_id);
        setExistingImageUrl(refreshedResult.data.image_url);
        setOptionGroups(createOptionGroupDrafts(refreshedResult.data.option_groups));
        setImage(null);
        setCroppedImagePreview(null);
        setStatusMessage("メニューを更新しました。");
        return;
      }

      if (!image) return;
      const croppedDataUrl = await createCroppedImageDataUrl(image, imageCrop, 1200);
      const [, croppedBase64] = croppedDataUrl.split(",", 2);
      if (!croppedBase64) {
        throw new Error("画像データを変換できませんでした。");
      }

      const payload: MenuCreateRequest = {
        menu_category_id: categoryId ? Number(categoryId) : null,
        name: name.trim(),
        description: description.trim() || null,
        price,
        token_symbol: "JPYC",
        menu_image: croppedBase64,
        image_extension: image.extension,
        is_available: isAvailable,
        display_order: displayOrder,
        option_groups: optionGroups.map((group) => ({
          name: group.name.trim(),
          min_selections: group.minSelections,
          max_selections: group.maxSelections,
          display_order: group.displayOrder,
          is_active: group.isActive,
          options: group.options.map((option) => ({
            name: option.name.trim(),
            additional_price: option.additionalPrice || "0",
            display_order: option.displayOrder,
            is_available: option.isAvailable,
          })),
        })),
      };

      await createMenu(payload);
      resetForm();
      setStatusMessage("メニューを登録しました。");
    } catch (error) {
      setErrorMessage(
        readClientError(
          error,
          `メニューの${isEditMode ? "更新" : "登録"}に失敗しました。`,
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedCategory = categories.find(
    (category) => String(category.menu_category_id) === categoryId,
  );

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <LoadingOverlay
        open={isSubmitting || isLoadingMenu}
        label={isLoadingMenu ? "メニューを読み込んでいます…" : `メニューを${isEditMode ? "更新" : "登録"}中…`}
      />
      <FeedbackBanner message={errorMessage} severity="error" onClose={closeFeedback} />
      <FeedbackBanner message={statusMessage} severity="success" onClose={closeFeedback} />

      <Button
        type="button"
        variant="contained"
        onClick={() => setIsPreviewDrawerOpen(true)}
        aria-label={`${isEditMode ? "更新" : "登録"}内容のプレビューを見る`}
        sx={{
          position: "fixed",
          right: 0,
          top: "50%",
          zIndex: (theme) => theme.zIndex.drawer - 1,
          display: { xs: "flex", xl: "none" },
          minWidth: 48,
          px: 1,
          py: 1.5,
          borderRadius: "12px 0 0 12px",
          flexDirection: "column",
          gap: 0.75,
          boxShadow: 4,
          transform: "translateY(-50%)",
        }}
      >
        <VisibilityRoundedIcon fontSize="small" />
        <Box
          component="span"
          sx={{ writingMode: "vertical-rl", letterSpacing: "0.08em", lineHeight: 1.2 }}
        >
          プレビューを見る
        </Box>
      </Button>

      <Drawer
        anchor="right"
        open={isPreviewDrawerOpen}
        onClose={() => setIsPreviewDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "min(92vw, 380px)", sm: 380 },
              bgcolor: "background.default",
            },
          },
        }}
      >
        <Box sx={{ minHeight: "100%" }}>
          <Stack
            direction="row"
            spacing={2}
            sx={{
              px: 2.5,
              py: 2,
              position: "sticky",
              top: 0,
              zIndex: 1,
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: "background.paper",
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 800 }}>
                {isEditMode ? "更新" : "登録"}内容のプレビュー
              </Typography>
              <Typography variant="caption" color="text.secondary">
                メニュー選択画面での表示イメージ
              </Typography>
            </Box>
            <IconButton
              type="button"
              aria-label="プレビューを閉じる"
              onClick={() => setIsPreviewDrawerOpen(false)}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
          <Box
            sx={{
              m: 2,
              border: "2px solid",
              borderColor: "primary.main",
              borderRadius: 3,
              overflow: "hidden",
              bgcolor: "background.paper",
            }}
          >
          <Box
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: "4 / 3",
              bgcolor: "#eef2f6",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
            }}
          >
            {image || existingImageUrl ? (
              <Box
                component="img"
                src={croppedImagePreview ?? image?.dataUrl ?? existingImageUrl ?? undefined}
                alt="商品写真のプレビュー"
                sx={{
                  display: "block",
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  objectPosition: "center",
                }}
              />
            ) : (
              <ImageRoundedIcon sx={{ fontSize: 46, color: "text.disabled" }} />
            )}
          </Box>
          <Stack spacing={2} sx={{ p: 2.5 }}>
            <Box>
              <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
                <Chip
                  label={selectedCategory?.name ?? "未分類"}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={isAvailable ? "販売中" : "非公開"}
                  size="small"
                  color={isAvailable ? "success" : "default"}
                />
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {name.trim() || "商品名が入ります"}
              </Typography>
              <Typography variant="h6" color="primary.main" sx={{ mt: 0.75, fontWeight: 900 }}>
                {price === "" ? "価格未入力" : `${Number(price).toLocaleString()} JPYC`}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
            >
              {description.trim() || "商品の説明を入力すると、ここに表示されます。"}
            </Typography>
            <Box aria-hidden sx={{ height: 40 }} />
          </Stack>
          </Box>
        </Box>
      </Drawer>

      <Stack spacing={3}>
        <Box>
          <Button
            component={NextLink}
            href="/menus"
            startIcon={<ArrowBackRoundedIcon />}
            sx={{ px: 0, mb: 1 }}
          >
            メニュー一覧へ戻る
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            メニュー{isEditMode ? "編集" : "新規登録"}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            {isEditMode
              ? "商品の基本情報や画像、公開状態を更新できます。"
              : "お客様に表示する商品情報を入力してください。"}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 320px" },
            gap: 3,
            alignItems: "start",
          }}
        >
          <Stack spacing={3}>
            <Paper variant="outlined" sx={{ overflow: "hidden" }}>
              <Box sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "rgba(24, 169, 123, 0.06)" }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2.5,
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <RestaurantMenuRoundedIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      商品の基本情報
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      商品名や価格など、お客様に見せる内容を設定します。
                    </Typography>
                  </Box>
                </Stack>
              </Box>
              <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2.5,
                  }}
                >
                  <TextField
                    label="商品名"
                    placeholder="例：濃厚チーズバーガー"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    slotProps={{ htmlInput: { maxLength: 255 } }}
                  />
                  <FormControl fullWidth>
                    <InputLabel id="menu-category-label">カテゴリー</InputLabel>
                    <Select
                      labelId="menu-category-label"
                      label="カテゴリー"
                      value={categoryId}
                      disabled={isLoadingCategories}
                      onChange={(event) => setCategoryId(event.target.value)}
                    >
                      <MenuItem value="">未分類</MenuItem>
                      {categories.map((category) => (
                        <MenuItem
                          key={category.menu_category_id}
                          value={String(category.menu_category_id)}
                        >
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Stack spacing={2.5}>
                    <TextField
                      label="価格"
                      type="number"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      required
                      slotProps={{ htmlInput: { min: 0, step: "0.000001" } }}
                      helperText="JPYCで入力してください"
                    />
                    <TextField
                      label="一覧での表示順"
                      type="number"
                      value={displayOrder}
                      onChange={(event) =>
                        setDisplayOrder(Math.max(0, Number(event.target.value)))
                      }
                      slotProps={{ htmlInput: { min: 0 } }}
                      helperText="小さい数字から順に表示されます"
                    />
                  </Stack>
                  <TextField
                    label="商品の説明"
                    placeholder="商品の特徴やおすすめポイントを入力してください"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    multiline
                    minRows={4}
                    sx={{ gridColumn: { md: "1 / -1" } }}
                  />
                  <Box
                    sx={{
                      gridColumn: { md: "1 / -1" },
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: "grey.50",
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isAvailable}
                          onChange={(event) => setIsAvailable(event.target.checked)}
                        />
                      }
                      label={
                        isAvailable
                          ? isEditMode ? "販売中" : "登録後すぐに販売する"
                          : isEditMode ? "非公開" : "販売を一時停止して登録する"
                      }
                    />
                  </Box>
                </Box>
              </Box>
            </Paper>

            <Paper variant="outlined" sx={{ overflow: "hidden" }}>
              <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2.5,
                      bgcolor: "secondary.light",
                      color: "secondary.dark",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <ImageRoundedIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      商品写真
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      商品が分かりやすく写った画像を1枚登録してください。
                    </Typography>
                  </Box>
                </Stack>
              </Box>
              <Divider />
              <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                {image || existingImageUrl ? (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.4fr) minmax(240px, 1fr)" },
                      gap: 3,
                      alignItems: "start",
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          position: "relative",
                          width: "100%",
                          aspectRatio: "4 / 3",
                          borderRadius: 3,
                          bgcolor: "#eef2f6",
                          overflow: "hidden",
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Box
                          component="img"
                          src={croppedImagePreview ?? image?.dataUrl ?? existingImageUrl ?? undefined}
                          alt="4対3に切り抜いた商品写真"
                          sx={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                        枠内がメニュー選択画面に表示されます。
                      </Typography>
                    </Box>

                    <Stack spacing={2.25}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          写真の調整
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                          見せたい部分が中央に入るよう調整してください。
                        </Typography>
                      </Box>
                      <Box>
                        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                          <Typography variant="body2">表示サイズ</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {Math.round(imageCrop.zoom * 100)}%
                          </Typography>
                        </Stack>
                        <Slider
                          value={imageCrop.zoom}
                          min={0.25}
                          max={2.5}
                          step={0.05}
                          onChange={(_, value) =>
                            setImageCrop((current) => ({ ...current, zoom: Number(value) }))
                          }
                          aria-label="画像の表示サイズ"
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2">左右の位置</Typography>
                        <Slider
                          value={imageCrop.positionX}
                          min={0}
                          max={100}
                          onChange={(_, value) =>
                            setImageCrop((current) => ({ ...current, positionX: Number(value) }))
                          }
                          aria-label="画像の左右位置"
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2">上下の位置</Typography>
                        <Slider
                          value={imageCrop.positionY}
                          min={0}
                          max={100}
                          onChange={(_, value) =>
                            setImageCrop((current) => ({ ...current, positionY: Number(value) }))
                          }
                          aria-label="画像の上下位置"
                        />
                      </Box>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button
                          type="button"
                          variant="outlined"
                          color="inherit"
                          startIcon={<RestartAltRoundedIcon />}
                          onClick={() =>
                            setImageCrop({ zoom: 1, positionX: 50, positionY: 50 })
                          }
                        >
                          位置をリセット
                        </Button>
                        <Button component="label" variant="outlined" startIcon={<CloudUploadRoundedIcon />}>
                          画像を変更
                          <input
                            hidden
                            type="file"
                            accept="image/png,image/jpeg"
                            onChange={handleImageChange}
                          />
                        </Button>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {image?.fileName ?? "登録済み画像（変更時のみ新しい画像を選択）"}
                      </Typography>
                    </Stack>
                  </Box>
                ) : (
                  <Box
                    component="label"
                    sx={{
                      minHeight: 230,
                      borderRadius: 3,
                      border: "2px dashed",
                      borderColor: "divider",
                      bgcolor: "grey.50",
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                      transition: "border-color 160ms ease, background-color 160ms ease",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: "rgba(24, 169, 123, 0.05)",
                      },
                    }}
                  >
                    <Stack spacing={1.25} sx={{ alignItems: "center", textAlign: "center", p: 3 }}>
                      <CloudUploadRoundedIcon sx={{ fontSize: 42, color: "primary.main" }} />
                      <Typography sx={{ fontWeight: 800 }}>クリックして商品写真を選択</Typography>
                      <Typography variant="body2" color="text.secondary">
                        PNG・JPG・JPEG形式／登録時に4:3へ切り抜きます
                      </Typography>
                    </Stack>
                    <input hidden type="file" accept="image/png,image/jpeg" onChange={handleImageChange} />
                  </Box>
                )}
              </Box>
            </Paper>

            <Paper variant="outlined" sx={{ overflow: "hidden" }}>
              <Box sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "rgba(101, 78, 196, 0.05)" }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
                >
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2.5,
                        bgcolor: "secondary.main",
                        color: "secondary.contrastText",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <TuneRoundedIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        注文時の選択項目
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        サイズ、辛さ、追加内容などを選べる商品に設定できます。
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    type="button"
                    variant="contained"
                    color="secondary"
                    startIcon={<AddRoundedIcon />}
                    onClick={addOptionGroup}
                    sx={{ flexShrink: 0 }}
                  >
                    選択項目を追加
                  </Button>
                </Stack>
              </Box>

              <Stack spacing={2.5} sx={{ p: { xs: 2.5, md: 3 } }}>
                {optionGroups.length === 0 ? (
                  <Box
                    sx={{
                      py: 4,
                      px: 2,
                      border: "1px dashed",
                      borderColor: "divider",
                      borderRadius: 3,
                      textAlign: "center",
                      bgcolor: "grey.50",
                    }}
                  >
                    <Typography sx={{ fontWeight: 700 }}>選べる内容はまだありません</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      選択項目が不要な商品は、このまま登録できます。
                    </Typography>
                  </Box>
                ) : null}

                {optionGroups.map((group, groupIndex) => (
                  <Box
                    key={group.id}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.5}
                      sx={{
                        px: { xs: 2, md: 2.5 },
                        py: 2,
                        justifyContent: "space-between",
                        alignItems: { sm: "center" },
                        bgcolor: "grey.50",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                        <Chip
                          label={`選択項目 ${groupIndex + 1}`}
                          size="small"
                          color="secondary"
                        />
                        <Typography sx={{ fontWeight: 800 }}>
                          {group.name.trim() || "項目名を入力してください"}
                        </Typography>
                        <Chip
                          label={group.minSelections > 0 ? "選択必須" : "選択任意"}
                          size="small"
                          color={group.minSelections > 0 ? "warning" : "default"}
                          variant="outlined"
                        />
                        {!group.isActive ? (
                          <Chip label="非表示" size="small" variant="outlined" />
                        ) : null}
                      </Stack>
                      <IconButton
                        aria-label="この選択項目を削除"
                        color="error"
                        onClick={() =>
                          setOptionGroups((current) =>
                            current.filter((item) => item.id !== group.id),
                          )
                        }
                        sx={{ alignSelf: { xs: "flex-end", sm: "center" } }}
                      >
                        <DeleteOutlineRoundedIcon />
                      </IconButton>
                    </Stack>

                    <Stack spacing={3.5} sx={{ p: { xs: 2, md: 3 } }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>
                          選択項目名
                        </Typography>
                        <TextField
                          placeholder="例：サイズ"
                          value={group.name}
                          onChange={(event) => updateGroup(group.id, { name: event.target.value })}
                          required
                          fullWidth
                          slotProps={{ htmlInput: { maxLength: 100 } }}
                          helperText="注文画面に「サイズ」「トッピング」などの見出しとして表示されます"
                        />
                      </Box>

                      <Box
                        sx={{
                          p: { xs: 2, md: 2.5 },
                          borderRadius: 3,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "grey.50",
                        }}
                      >
                        <Typography sx={{ fontWeight: 800 }}>選択ルール</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, mb: 2.5 }}>
                          必須か任意か、いくつまで選べるかを設定します。
                        </Typography>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
                            gap: 2,
                          }}
                        >
                          <TextField
                            label="最低選択数"
                            type="number"
                            value={group.minSelections}
                            onChange={(event) =>
                              updateGroup(group.id, {
                                minSelections: Math.max(0, Number(event.target.value)),
                              })
                            }
                            slotProps={{ htmlInput: { min: 0 } }}
                            helperText="0にすると選択は任意"
                          />
                          <TextField
                            label="選択できる上限"
                            type="number"
                            value={group.maxSelections}
                            onChange={(event) =>
                              updateGroup(group.id, {
                                maxSelections: Math.max(1, Number(event.target.value)),
                              })
                            }
                            slotProps={{ htmlInput: { min: 1 } }}
                            helperText="一度に選べる最大数"
                          />
                          <TextField
                            label="項目の表示順"
                            type="number"
                            value={group.displayOrder}
                            onChange={(event) =>
                              updateGroup(group.id, {
                                displayOrder: Math.max(0, Number(event.target.value)),
                              })
                            }
                            slotProps={{ htmlInput: { min: 0 } }}
                            helperText="小さい数字から表示"
                          />
                        </Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={group.isActive}
                              onChange={(event) =>
                                updateGroup(group.id, { isActive: event.target.checked })
                              }
                            />
                          }
                          label="この選択項目を注文画面に表示する"
                          sx={{ mt: 2 }}
                        />
                      </Box>

                      <Divider />

                      <Box>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1.5}
                          sx={{
                            mb: 2,
                            justifyContent: "space-between",
                            alignItems: { sm: "flex-end" },
                          }}
                        >
                          <Box>
                            <Typography sx={{ fontWeight: 800 }}>お客様が選べる選択肢</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                              例：「Sサイズ」「Mサイズ」「チーズ追加」など
                            </Typography>
                          </Box>
                          <Button
                            type="button"
                            variant="outlined"
                            startIcon={<AddRoundedIcon />}
                            onClick={() => addOption(group.id)}
                            sx={{ flexShrink: 0 }}
                          >
                            選択肢を追加
                          </Button>
                        </Stack>

                        {group.options.length === 0 ? (
                          <Box
                            sx={{
                              p: 3,
                              border: "1px dashed",
                              borderColor: "divider",
                              borderRadius: 2.5,
                              textAlign: "center",
                              bgcolor: "grey.50",
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              選択肢がありません。「選択肢を追加」から登録してください。
                            </Typography>
                          </Box>
                        ) : (
                          <Stack spacing={1.25}>
                            {group.options.map((option, optionIndex) => (
                              <Box
                                key={option.id}
                                sx={{
                                  display: "grid",
                                  gridTemplateColumns: {
                                    xs: "36px minmax(0, 1fr)",
                                    md: "36px minmax(180px, 2fr) minmax(140px, 1fr) 110px auto auto",
                                  },
                                  gap: 1.5,
                                  alignItems: "center",
                                  p: 1.5,
                                  border: "1px solid",
                                  borderColor: "divider",
                                  borderRadius: 2.5,
                                  bgcolor: "background.paper",
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    bgcolor: "rgba(101, 78, 196, 0.10)",
                                    color: "secondary.main",
                                    display: "grid",
                                    placeItems: "center",
                                    fontSize: 13,
                                    fontWeight: 800,
                                  }}
                                >
                                  {optionIndex + 1}
                                </Box>
                                <TextField
                                  label="選択肢名"
                                  placeholder="例：Mサイズ"
                                  value={option.name}
                                  onChange={(event) =>
                                    updateOption(group.id, option.id, { name: event.target.value })
                                  }
                                  required
                                  size="small"
                                  slotProps={{ htmlInput: { maxLength: 100 } }}
                                  sx={{ gridColumn: { xs: "2", md: "auto" } }}
                                />
                                <TextField
                                  label="追加料金"
                                  type="number"
                                  value={option.additionalPrice}
                                  onChange={(event) =>
                                    updateOption(group.id, option.id, {
                                      additionalPrice: event.target.value,
                                    })
                                  }
                                  size="small"
                                  slotProps={{ htmlInput: { min: 0, step: "0.000001" } }}
                                  sx={{ gridColumn: { xs: "2", md: "auto" } }}
                                />
                                <TextField
                                  label="表示順"
                                  type="number"
                                  value={option.displayOrder}
                                  onChange={(event) =>
                                    updateOption(group.id, option.id, {
                                      displayOrder: Math.max(0, Number(event.target.value)),
                                    })
                                  }
                                  size="small"
                                  slotProps={{ htmlInput: { min: 0 } }}
                                  sx={{ gridColumn: { xs: "2", md: "auto" } }}
                                />
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={option.isAvailable}
                                      onChange={(event) =>
                                        updateOption(group.id, option.id, {
                                          isAvailable: event.target.checked,
                                        })
                                      }
                                      size="small"
                                    />
                                  }
                                  label="選択可"
                                  sx={{
                                    m: 0,
                                    whiteSpace: "nowrap",
                                    gridColumn: { xs: "2", md: "auto" },
                                  }}
                                />
                                <IconButton
                                  aria-label="この選択肢を削除"
                                  color="error"
                                  onClick={() =>
                                    updateGroup(group.id, {
                                      options: group.options.filter((item) => item.id !== option.id),
                                    })
                                  }
                                  sx={{
                                    gridColumn: { xs: "2", md: "auto" },
                                    justifySelf: { xs: "end", md: "auto" },
                                  }}
                                >
                                  <DeleteOutlineRoundedIcon />
                                </IconButton>
                              </Box>
                            ))}
                          </Stack>
                        )}
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Stack>

          <Paper
            variant="outlined"
            sx={{
              display: { xs: "none", xl: "block" },
              position: { xl: "sticky" },
              top: { xl: 96 },
              overflow: "hidden",
            }}
          >
            <Box sx={{ px: 2.5, py: 2, bgcolor: "grey.50" }}>
              <Typography sx={{ fontWeight: 800 }}>
                {isEditMode ? "更新" : "登録"}内容のプレビュー
              </Typography>
              <Typography variant="caption" color="text.secondary">
                入力内容を確認しながら{isEditMode ? "更新" : "登録"}できます
              </Typography>
            </Box>
            <Box
              sx={{
                m: 2,
                border: "2px solid",
                borderColor: "primary.main",
                borderRadius: 3,
                overflow: "hidden",
                bgcolor: "background.paper",
              }}
            >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                aspectRatio: "4 / 3",
                bgcolor: "#eef2f6",
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
              }}
            >
              {image || existingImageUrl ? (
                <Box
                  component="img"
                  src={croppedImagePreview ?? image?.dataUrl ?? existingImageUrl ?? undefined}
                  alt="商品写真のプレビュー"
                  sx={{
                    display: "block",
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    objectPosition: "center",
                  }}
                />
              ) : (
                <ImageRoundedIcon sx={{ fontSize: 46, color: "text.disabled" }} />
              )}
            </Box>
            <Stack spacing={2} sx={{ p: 2.5 }}>
              <Box>
                <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
                  <Chip
                    label={selectedCategory?.name ?? "未分類"}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={isAvailable ? "販売中" : "非公開"}
                    size="small"
                    color={isAvailable ? "success" : "default"}
                  />
                </Stack>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  {name.trim() || "商品名が入ります"}
                </Typography>
                <Typography variant="h6" color="primary.main" sx={{ mt: 0.75, fontWeight: 900 }}>
                  {price === "" ? "価格未入力" : `${Number(price).toLocaleString()} JPYC`}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
              >
                {description.trim() || "商品の説明を入力すると、ここに表示されます。"}
              </Typography>
              <Box aria-hidden sx={{ height: 40 }} />
            </Stack>
            </Box>
          </Paper>
        </Box>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
            justifyContent: "flex-end",
            alignItems: { sm: "center" },
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mr: { sm: "auto" } }}>
            必須項目を入力して、{isEditMode ? "更新" : "登録"}内容をご確認ください。
          </Typography>
          <Button component={NextLink} href="/menus" variant="outlined" color="inherit">
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting || isLoadingMenu || (isEditMode && !hasLoadedMenu)}
          >
            この内容で{isEditMode ? "更新" : "登録"}する
          </Button>
        </Paper>
      </Stack>
    </Box>
  );
}
