import { getInitialWallet } from "@/features/store-wallet/api/client";
import { WalletDetailView } from "@/features/store-wallet/ui/wallet-detail-view";

export default async function Page() {
  const { initialWallet, initialError } = await getInitialWallet();

  return (
    <WalletDetailView
      initialWallet={initialWallet}
      initialError={initialError}
    />
  );
}
