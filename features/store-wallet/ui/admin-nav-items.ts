export interface AdminNavItem {
  href?: string;
  label: string;
  items?: AdminNavItem[];
}

export const adminNavItems: AdminNavItem[] = [
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
