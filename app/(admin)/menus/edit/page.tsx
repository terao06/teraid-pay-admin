import { Suspense } from "react";

import { MenuEditView } from "@/features/menu/ui/menu-edit-view";

export default function MenuEditPage() {
  return (
    <Suspense fallback={<p>メニューを読み込んでいます…</p>}>
      <MenuEditView />
    </Suspense>
  );
}
