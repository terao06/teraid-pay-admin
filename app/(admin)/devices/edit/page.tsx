import { Suspense } from "react";

import { DeviceEditView } from "@/features/device/ui/device-edit-view";

export default function DeviceEditPage() {
  return (
    <Suspense fallback={<p>デバイスを読み込んでいます…</p>}>
      <DeviceEditView />
    </Suspense>
  );
}
