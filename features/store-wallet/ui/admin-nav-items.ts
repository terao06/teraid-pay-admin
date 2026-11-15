export interface AdminNavItem {
  href?: string;
  label: string;
  items?: AdminNavItem[];
}

export const adminNavItems: AdminNavItem[] = [
  {
    label: "メニュー管理",
    items: [
      {
        href: "/menu-categories",
        label: "カテゴリー一覧",
      },
      {
        href: "/menus",
        label: "メニュー一覧",
      }
    ],
  },
  {
    label: "ウォレット",
    items: [
      {
        href: "/",
        label: "ウォレット詳細",
      },
      {
        href: "/register",
        label: "ウォレット登録",
      },
    ],
  },
];
