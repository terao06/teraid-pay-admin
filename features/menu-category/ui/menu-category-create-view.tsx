"use client";

import { type ChangeEvent, type DragEvent, type FormEvent, useEffect, useRef, useState } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import NextLink from "next/link";
import {
  Box,
  Button,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  Paper,
  Slider,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  createMenuCategory,
  fetchMenuCategory,
  updateMenuCategory,
} from "@/features/menu-category/api/client";
import type { MenuCategoryImageExtension } from "@/features/menu-category/domain/types";
import { readClientError } from "@/features/store-wallet/api/client";
import { FeedbackBanner } from "@/features/store-wallet/ui/feedback-banner";
import { LoadingOverlay } from "@/features/store-wallet/ui/loading-overlay";

interface CategoryImageDraft {
  base64: string;
  dataUrl: string;
  extension: MenuCategoryImageExtension;
  fileName: string;
  size: number;
}

interface ImageCropSettings {
  zoom: number;
  positionX: number;
  positionY: number;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function readCategoryImage(file: File): Promise<CategoryImageDraft> {
  return new Promise((resolve, reject) => {
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension !== "png" && extension !== "jpg" && extension !== "jpeg") {
      reject(new Error("PNG、JPG、JPEG形式の画像を選択してください。"));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      reject(new Error("画像サイズは10MB以下にしてください。"));
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

      resolve({
        base64,
        dataUrl: reader.result,
        extension,
        fileName: file.name,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  });
}

function createCroppedImageDataUrl(
  image: CategoryImageDraft,
  crop: ImageCropSettings,
  outputWidth: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const source = new window.Image();
    source.onerror = () => reject(new Error("画像の切り抜き処理に失敗しました。"));
    source.onload = () => {
      const outputHeight = outputWidth;
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

interface MenuCategoryCreateViewProps {
  menuCategoryId?: number;
}

export function MenuCategoryCreateView({ menuCategoryId }: MenuCategoryCreateViewProps = {}) {
  const isEditMode = menuCategoryId !== undefined;
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState<CategoryImageDraft | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageCrop, setImageCrop] = useState<ImageCropSettings>({
    zoom: 1,
    positionX: 50,
    positionY: 50,
  });
  const [croppedImagePreview, setCroppedImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategory, setIsLoadingCategory] = useState(isEditMode);
  const [hasLoadedCategory, setHasLoadedCategory] = useState(!isEditMode);
  const [isPreviewDrawerOpen, setIsPreviewDrawerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const normalizedName = name.trim();
  const numericDisplayOrder = Number(displayOrder);
  const isNameValid = normalizedName.length >= 1 && normalizedName.length <= 100;
  const isDisplayOrderValid = Number.isInteger(numericDisplayOrder) && numericDisplayOrder >= 0;
  const canSubmit =
    (Boolean(image) || Boolean(existingImageUrl)) &&
    isNameValid &&
    isDisplayOrderValid &&
    hasLoadedCategory &&
    !isLoadingCategory &&
    !isSubmitting;

  useEffect(() => {
    if (menuCategoryId === undefined) return;

    let isMounted = true;

    async function loadCategory() {
      setIsLoadingCategory(true);
      setHasLoadedCategory(false);
      setErrorMessage(null);

      try {
        const result = await fetchMenuCategory(menuCategoryId as number);
        if (!isMounted) return;

        setName(result.data.name);
        setDisplayOrder(String(result.data.display_order));
        setIsActive(result.data.is_active);
        setExistingImageUrl(result.data.image_url);
        setHasLoadedCategory(true);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(readClientError(error, "カテゴリーの詳細取得に失敗しました。"));
        }
      } finally {
        if (isMounted) setIsLoadingCategory(false);
      }
    }

    void loadCategory();

    return () => {
      isMounted = false;
    };
  }, [menuCategoryId]);

  useEffect(() => {
    let isActive = true;
    if (!image) {
      return () => {
        isActive = false;
      };
    }

    void createCroppedImageDataUrl(image, imageCrop, 640)
      .then((dataUrl) => {
        if (isActive) setCroppedImagePreview(dataUrl);
      })
      .catch(() => {
        if (isActive) setCroppedImagePreview(null);
      });

    return () => {
      isActive = false;
    };
  }, [image, imageCrop]);

  async function selectImage(file: File | undefined) {
    if (!file) return;

    setImageError(null);
    try {
      setCroppedImagePreview(null);
      setImage(await readCategoryImage(file));
      setImageCrop({ zoom: 1, positionX: 50, positionY: 50 });
    } catch (error) {
      setImage(null);
      setImageError(readClientError(error, "画像を読み込めませんでした。"));
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    void selectImage(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void selectImage(event.dataTransfer.files?.[0]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!image && !isEditMode) {
      setImageError("カテゴリー画像を選択してください。");
      return;
    }
    if (!isNameValid || !isDisplayOrderValid) {
      setErrorMessage("入力内容を確認してください。");
      return;
    }

    setIsSubmitting(true);
    try {
      let croppedBase64: string | undefined;

      if (image) {
        const croppedDataUrl = await createCroppedImageDataUrl(image, imageCrop, 1200);
        [, croppedBase64] = croppedDataUrl.split(",", 2);
        if (!croppedBase64) {
          throw new Error("画像データを変換できませんでした。");
        }
      }

      if (isEditMode) {
        const result = await updateMenuCategory(menuCategoryId, {
          name: normalizedName,
          display_order: numericDisplayOrder,
          is_active: isActive,
          ...(croppedBase64 && image
            ? { category_image: croppedBase64, image_extension: image.extension }
            : {}),
        });

        let refreshedResult: Awaited<ReturnType<typeof fetchMenuCategory>>;
        try {
          refreshedResult = await fetchMenuCategory(result.data.menu_category_id);
        } catch (error) {
          setStatusMessage(`「${normalizedName}」を更新しました。`);
          setErrorMessage(
            readClientError(
              error,
              "更新は完了しましたが、最新情報の取得に失敗しました。",
            ),
          );
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        setName(refreshedResult.data.name);
        setDisplayOrder(String(refreshedResult.data.display_order));
        setIsActive(refreshedResult.data.is_active);
        setExistingImageUrl(refreshedResult.data.image_url);
        setImage(null);
        setImageCrop({ zoom: 1, positionX: 50, positionY: 50 });
        setCroppedImagePreview(null);
        setStatusMessage(`「${refreshedResult.data.name}」を更新しました。`);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        if (!croppedBase64 || !image) {
          throw new Error("カテゴリー画像を選択してください。");
        }

        const result = await createMenuCategory({
          name: normalizedName,
          category_image: croppedBase64,
          image_extension: image.extension,
          display_order: numericDisplayOrder,
          is_active: isActive,
        });
        clearFormFields();
        setStatusMessage(
          `「${normalizedName}」を登録しました。カテゴリーID: ${result.data.menu_category_id}`,
        );
      }
    } catch (error) {
      setErrorMessage(
        readClientError(
          error,
          isEditMode
            ? "カテゴリーの更新に失敗しました。"
            : "カテゴリーの登録に失敗しました。",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function clearFormFields() {
    setName("");
    setDisplayOrder("0");
    setIsActive(true);
    setImage(null);
    setImageCrop({ zoom: 1, positionX: 50, positionY: 50 });
    setCroppedImagePreview(null);
    setIsDragging(false);
    setIsPreviewDrawerOpen(false);
    setImageError(null);
    setErrorMessage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const categoryPreview = (
    <Box
      sx={{
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
          aspectRatio: "1 / 1",
          bgcolor: "#eef2f6",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
        }}
      >
        {image || existingImageUrl ? (
          <Box
            component="img"
            src={image ? (croppedImagePreview ?? image.dataUrl) : existingImageUrl ?? undefined}
            alt="カテゴリー画像のプレビュー"
            sx={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
          />
        ) : (
          <ImageRoundedIcon sx={{ fontSize: 46, color: "text.disabled" }} />
        )}
      </Box>
      <Box sx={{ p: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 900, overflowWrap: "anywhere" }}>
          {normalizedName || "カテゴリー名を入力"}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      <LoadingOverlay
        open={isSubmitting || isLoadingCategory}
        label={isLoadingCategory ? "カテゴリーを読み込んでいます…" : `カテゴリーを${isEditMode ? "更新" : "登録"}しています…`}
      />
      <FeedbackBanner message={errorMessage} severity="error" onClose={() => setErrorMessage(null)} />
      <FeedbackBanner message={statusMessage} severity="success" onClose={() => setStatusMessage(null)} />

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Button
          type="button"
          variant="contained"
          onClick={() => setIsPreviewDrawerOpen(true)}
          aria-label="カテゴリーのプレビューを見る"
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
          <Box component="span" sx={{ writingMode: "vertical-rl", letterSpacing: "0.08em", lineHeight: 1.2 }}>
            プレビューを見る
          </Box>
        </Button>

        <Drawer
          anchor="right"
          open={isPreviewDrawerOpen}
          onClose={() => setIsPreviewDrawerOpen(false)}
          slotProps={{ paper: { sx: { width: { xs: "min(92vw, 380px)", sm: 380 }, bgcolor: "background.default" } } }}
        >
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
              <Typography sx={{ fontWeight: 800 }}>{isEditMode ? "更新" : "登録"}内容のプレビュー</Typography>
              <Typography variant="caption" color="text.secondary">オーダー端末での表示イメージ</Typography>
            </Box>
            <IconButton type="button" aria-label="プレビューを閉じる" onClick={() => setIsPreviewDrawerOpen(false)}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
          <Box sx={{ m: 2 }}>{categoryPreview}</Box>
        </Drawer>

        <Stack spacing={3}>
          <Box>
            <Button
              component={NextLink}
              href="/menu-categories"
              startIcon={<ArrowBackRoundedIcon />}
              sx={{ px: 0, mb: 1 }}
            >
              カテゴリー一覧へ戻る
            </Button>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              カテゴリー{isEditMode ? "編集" : "新規登録"}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              {isEditMode
                ? "カテゴリーの詳細を確認し、必要な情報を更新してください。"
                : "メニューを整理するカテゴリー情報を入力してください。"}
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
                <Stack direction="row" spacing={2} sx={{ p: { xs: 2.5, md: 3 }, alignItems: "center", bgcolor: "rgba(24, 169, 123, 0.06)" }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 2.5,
                      color: "primary.contrastText",
                      bgcolor: "primary.main",
                    }}
                  >
                    <CategoryRoundedIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>カテゴリーの基本情報</Typography>
                    <Typography variant="body2" color="text.secondary">カテゴリー名、表示順、利用状態を設定します。</Typography>
                  </Box>
                </Stack>
                <Divider />
                <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
                  <TextField
                    label="カテゴリー名"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    autoFocus
                    placeholder="例：ドリンク"
                    error={name.length > 100}
                    helperText={
                      <Box component="span" sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                        <span>お客様にも分かりやすい短い名前がおすすめです。</span>
                        <span>{name.length}/100</span>
                      </Box>
                    }
                    slotProps={{ htmlInput: { maxLength: 100 } }}
                  />
                  <TextField
                    label="表示順"
                    value={displayOrder}
                    onChange={(event) => setDisplayOrder(event.target.value)}
                    type="number"
                    required
                    error={displayOrder !== "" && !isDisplayOrderValid}
                    helperText="数字が小さいカテゴリーから先に表示されます。"
                    slotProps={{ htmlInput: { min: 0, step: 1, inputMode: "numeric" } }}
                  />
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      bgcolor: isActive ? "#f1fbf7" : "#f7f8fa",
                      boxShadow: "none",
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>有効状態</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        有効にすると、メニュー登録時の選択肢に表示されます。
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={<Switch checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />}
                      label={isActive ? "有効" : "無効"}
                      labelPlacement="start"
                      sx={{ m: 0, flexShrink: 0, "& .MuiFormControlLabel-label": { fontWeight: 800 } }}
                    />
                  </Paper>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ overflow: "hidden" }}>
                <Stack direction="row" spacing={2} sx={{ p: { xs: 2.5, md: 3 }, alignItems: "center", bgcolor: "rgba(108, 99, 255, 0.06)" }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 2.5,
                      color: "#ffffff",
                      bgcolor: "secondary.main",
                    }}
                  >
                    <ImageRoundedIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>カテゴリー画像</Typography>
                    <Typography variant="body2" color="text.secondary">正方形に調整して、PNG・JPG・JPEG形式で登録します。</Typography>
                  </Box>
                </Stack>
                <Divider />
                <Box sx={{ p: { xs: 2, md: 3 } }}>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                    hidden
                    onChange={handleImageChange}
                  />
                  {image ? (
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
                            aspectRatio: "1 / 1",
                            borderRadius: 3,
                            bgcolor: "#eef2f6",
                            overflow: "hidden",
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <Box
                            component="img"
                            src={croppedImagePreview ?? image.dataUrl}
                            alt="正方形に切り抜いたカテゴリー画像"
                            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                          枠内がオーダー端末に表示されます。
                        </Typography>
                      </Box>

                      <Stack spacing={2.25} sx={{ minWidth: 0 }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>画像の調整</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                            見せたい範囲が枠内に入るよう調整してください。
                          </Typography>
                        </Box>
                        <Box>
                          <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                            <Typography variant="body2">表示サイズ</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{Math.round(imageCrop.zoom * 100)}%</Typography>
                          </Stack>
                          <Slider
                            value={imageCrop.zoom}
                            min={0.25}
                            max={2.5}
                            step={0.05}
                            onChange={(_, value) => setImageCrop((current) => ({ ...current, zoom: Number(value) }))}
                            aria-label="画像の表示サイズ"
                          />
                        </Box>
                        <Box>
                          <Typography variant="body2">左右の位置</Typography>
                          <Slider
                            value={imageCrop.positionX}
                            min={0}
                            max={100}
                            onChange={(_, value) => setImageCrop((current) => ({ ...current, positionX: Number(value) }))}
                            aria-label="画像の左右位置"
                          />
                        </Box>
                        <Box>
                          <Typography variant="body2">上下の位置</Typography>
                          <Slider
                            value={imageCrop.positionY}
                            min={0}
                            max={100}
                            onChange={(_, value) => setImageCrop((current) => ({ ...current, positionY: Number(value) }))}
                            aria-label="画像の上下位置"
                          />
                        </Box>
                        <Stack spacing={1} sx={{ width: "100%" }}>
                          <Button
                            type="button"
                            variant="outlined"
                            color="inherit"
                            startIcon={<RestartAltRoundedIcon />}
                            onClick={() => setImageCrop({ zoom: 1, positionX: 50, positionY: 50 })}
                            fullWidth
                            sx={{ whiteSpace: "nowrap" }}
                          >
                            位置をリセット
                          </Button>
                          <Button
                            type="button"
                            variant="outlined"
                            startIcon={<CloudUploadRoundedIcon />}
                            onClick={() => imageInputRef.current?.click()}
                            fullWidth
                            sx={{ whiteSpace: "nowrap" }}
                          >
                            画像を変更
                          </Button>
                          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <Tooltip title={existingImageUrl ? "画像の変更を取り消す" : "画像を削除"}>
                              <IconButton
                                aria-label="選択した画像を削除"
                                color="error"
                                onClick={() => {
                                  setImage(null);
                                  setImageCrop({ zoom: 1, positionX: 50, positionY: 50 });
                                }}
                              >
                                <DeleteOutlineRoundedIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {image.fileName} ・ {image.extension.toUpperCase()} ・ {formatFileSize(image.size)}
                        </Typography>
                      </Stack>
                    </Box>
                  ) : existingImageUrl ? (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.4fr) minmax(240px, 1fr)" },
                        gap: 3,
                        alignItems: "center",
                      }}
                    >
                      <Box
                        component="img"
                        src={existingImageUrl}
                        alt="現在のカテゴリー画像"
                        sx={{
                          width: "100%",
                          aspectRatio: "1 / 1",
                          display: "block",
                          objectFit: "cover",
                          borderRadius: 3,
                          bgcolor: "#eef2f6",
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>現在の画像</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            画像を変更しない場合は、このまま更新できます。
                          </Typography>
                        </Box>
                        <Button
                          type="button"
                          variant="outlined"
                          startIcon={<CloudUploadRoundedIcon />}
                          onClick={() => imageInputRef.current?.click()}
                        >
                          画像を変更
                        </Button>
                      </Stack>
                    </Box>
                  ) : (
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => imageInputRef.current?.click()}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          imageInputRef.current?.click();
                        }
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      sx={{
                        minHeight: 220,
                        display: "grid",
                        placeItems: "center",
                        p: 3,
                        border: "2px dashed",
                        borderColor: imageError ? "error.main" : isDragging ? "primary.main" : "#cbd4df",
                        borderRadius: 3,
                        bgcolor: isDragging ? "#eef9f5" : "#fafbfd",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 160ms ease",
                        "&:hover": { borderColor: "primary.main", bgcolor: "#f4fbf8" },
                        "&:focus-visible": { outline: "3px solid rgba(24,169,123,0.22)", outlineOffset: 2 },
                      }}
                    >
                      <Stack spacing={1.5} sx={{ alignItems: "center" }}>
                        <Box sx={{ width: 56, height: 56, display: "grid", placeItems: "center", borderRadius: "50%", color: "primary.dark", bgcolor: "#e9f8f2" }}>
                          <CloudUploadRoundedIcon />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>画像をドラッグ＆ドロップ</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>またはクリックしてファイルを選択</Typography>
                        </Box>
                      </Stack>
                    </Box>
                  )}
                  {imageError ? <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>{imageError}</Typography> : null}
                </Box>
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
                <Typography sx={{ fontWeight: 800 }}>{isEditMode ? "更新" : "登録"}内容のプレビュー</Typography>
                <Typography variant="caption" color="text.secondary">オーダー端末での表示イメージ</Typography>
              </Box>
              <Box sx={{ m: 2 }}>{categoryPreview}</Box>
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
            <Button component={NextLink} href="/menu-categories" variant="outlined" color="inherit">
              キャンセル
            </Button>
            <Button type="submit" variant="contained" size="large" startIcon={<SaveRoundedIcon />} disabled={!canSubmit}>
              この内容で{isEditMode ? "更新" : "登録"}する
            </Button>
          </Paper>
        </Stack>
      </Box>
    </>
  );
}
