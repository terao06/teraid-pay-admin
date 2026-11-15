import { Suspense } from "react";

import { MenuCategoryEditView } from "@/features/menu-category/ui/menu-category-edit-view";

export default function MenuCategoryEditPage() {
  return (
    <Suspense fallback={<p>カテゴリーを読み込んでいます…</p>}>
      <MenuCategoryEditView />
    </Suspense>
  );
}
