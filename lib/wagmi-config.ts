import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, polygon, polygonAmoy, sepolia } from "wagmi/chains";

type WagmiConfig = ReturnType<typeof getDefaultConfig>;

declare global {
  // eslint-disable-next-line no-var
  var __wagmiConfig: WagmiConfig | undefined;
}

function createWagmiConfig(): WagmiConfig {
  return getDefaultConfig({
    appName: "Teraid Pay Admin",
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "",
    chains: [polygon, polygonAmoy, sepolia, mainnet],
    ssr: true,
  });
}

export const wagmiConfig: WagmiConfig =
  globalThis.__wagmiConfig ?? (globalThis.__wagmiConfig = createWagmiConfig());
