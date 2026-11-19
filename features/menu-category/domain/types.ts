export interface MenuCategory {
  menu_category_id: number;
  name: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
}

export interface MenuCategoryPagination {
  page: number;
  page_size: number | null;
  total: number;
  total_pages: number;
}

export interface MenuCategoryListResponse {
  status: "success";
  data: {
    menu_categories: MenuCategory[];
    pagination: MenuCategoryPagination;
  };
}

export interface MenuCategorySearchParams {
  name?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export type MenuCategoryImageExtension = "jpeg" | "jpg" | "png";

export interface MenuCategoryCreateRequest {
  name: string;
  category_image: string;
  image_extension: MenuCategoryImageExtension;
  display_order: number;
  is_active: boolean;
}

export interface MenuCategoryCreateResult {
  menu_category_id: number;
}

export interface MenuCategoryCreateResponse {
  status: "success";
  data: MenuCategoryCreateResult;
}

export interface MenuCategoryDetailResponse {
  status: "success";
  data: MenuCategory;
}

export interface MenuCategoryUpdateRequest {
  name: string;
  category_image?: string;
  image_extension?: MenuCategoryImageExtension;
  display_order: number;
  is_active: boolean;
}

export interface MenuCategoryUpdateResult {
  menu_category_id: number;
}

export interface MenuCategoryUpdateResponse {
  status: "success";
  data: MenuCategoryUpdateResult;
}

export interface MenuCategoryDeleteResponse {
  status: "success";
  data: {
    menu_category_id: number;
  };
}
