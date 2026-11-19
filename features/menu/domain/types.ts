export type {
  MenuCategory,
  MenuCategoryListResponse as MenuCategoriesSuccessResponse,
} from "@/features/menu-category/domain/types";

export interface MenuItem {
  menu_item_id: number;
  menu_category_id: number | null;
  menu_category_name: string | null;
  name: string;
  description: string | null;
  price: string;
  token_symbol: string;
  image_url: string;
  is_available: boolean;
  display_order: number;
}

export interface MenuOptionCreateRequest {
  name: string;
  additional_price: string;
  display_order: number;
  is_available: boolean;
}

export interface MenuOptionGroupCreateRequest {
  name: string;
  min_selections: number;
  max_selections: number;
  display_order: number;
  is_active: boolean;
  options: MenuOptionCreateRequest[];
}

export interface MenuCreateRequest {
  menu_category_id: number | null;
  name: string;
  description: string | null;
  price: string;
  token_symbol: "JPYC";
  menu_image: string;
  image_extension: "jpeg" | "jpg" | "png";
  is_available: boolean;
  display_order: number;
  option_groups: MenuOptionGroupCreateRequest[];
}

export interface MenuCreateResult {
  menu_item_id: number;
}

export interface MenuOption {
  menu_option_id: number;
  name: string;
  additional_price: string;
  display_order: number;
  is_available: boolean;
}

export interface MenuOptionGroup {
  menu_option_group_id: number;
  name: string;
  min_selections: number;
  max_selections: number;
  display_order: number;
  is_active: boolean;
  options: MenuOption[];
}

export interface MenuDetail extends MenuItem {
  option_groups: MenuOptionGroup[];
}

export interface MenuDetailResponse {
  status: "success";
  data: MenuDetail;
}

export interface MenuUpdateRequest {
  menu_category_id: number | null;
  name: string;
  description: string | null;
  price: string;
  token_symbol: "JPYC";
  menu_image?: string;
  image_extension?: "jpeg" | "jpg" | "png";
  is_available: boolean;
  display_order: number;
}

export interface MenuUpdateResponse {
  status: "success";
  data: MenuCreateResult;
}

export interface MenuDeleteResponse {
  status: "success";
  data: {
    menu_item_id: number;
  };
}

export interface MenuOptionUpdateRequest extends MenuOptionCreateRequest {
  menu_option_id?: number;
}

export interface MenuOptionGroupUpdateRequest
  extends Omit<MenuOptionGroupCreateRequest, "options"> {
  menu_option_group_id?: number;
  options: MenuOptionUpdateRequest[];
}

export interface MenuOptionGroupsUpdateRequest {
  option_groups: MenuOptionGroupUpdateRequest[];
}

export interface MenuOptionGroupUpdateResult {
  menu_option_group_id: number;
  menu_option_ids: number[];
}

export interface MenuOptionGroupsUpdateResponse {
  status: "success";
  data: {
    menu_item_id: number;
    menu_option_groups: MenuOptionGroupUpdateResult[];
  };
}

export interface MenuListSuccessResponse {
  status: "success";
  data: {
    menu_items: MenuItem[];
    pagination: MenuPagination;
  };
}

export interface MenuPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface MenuSearchParams {
  name?: string;
  menu_category_id?: number;
  is_available?: boolean;
  page?: number;
  page_size?: number;
}

export interface MenuCreateSuccessResponse {
  status: "success";
  data: MenuCreateResult;
}
