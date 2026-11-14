export interface MenuCategory {
  menu_category_id: number;
  name: string;
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

export interface MenuOptionGroupCreateResult {
  menu_option_group_id: number;
  menu_option_ids: number[];
}

export interface MenuCreateResult {
  menu_item_id: number;
  menu_option_groups: MenuOptionGroupCreateResult[];
}

export interface MenuCategoriesSuccessResponse {
  status: "success";
  data: { menu_categories: MenuCategory[] };
}

export interface MenuCreateSuccessResponse {
  status: "success";
  data: MenuCreateResult;
}
