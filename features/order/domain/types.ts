export interface OrderListOption {
  option_group_name: string;
  option_name: string;
  option_quantity: number;
}

export interface OrderListItem {
  menu_item_name: string;
  quantity: number;
  options: OrderListOption[];
}

export interface OrderListEntry {
  menu_order_id: number;
  visit_session_id: number | null;
  device_name: string | null;
  status: 1 | 2 | 3 | 4 | 5;
  created_at: string;
  served_at: string | null;
  items: OrderListItem[];
}

export interface OrderListResponse {
  status: "success";
  data: {
    orders: OrderListEntry[];
    pagination: {
      page: number;
      page_size: number;
      total: number;
      total_pages: number;
    };
  };
}
