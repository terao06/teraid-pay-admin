import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { avalancheFuji, polygonAmoy, sepolia } from "wagmi/chains";

type WagmiConfig = ReturnType<typeof getDefaultConfig>;

declare global {
  var __wagmiConfig: WagmiConfig | undefined;
}

function createWagmiConfig(): WagmiConfig {
  return getDefaultConfig({
    appName: "TeraiD Pay Admin",
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "",
    chains: [sepolia, avalancheFuji, polygonAmoy],
    transports: {
      [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL_ETHEREUM_SEPOLIA),
      [avalancheFuji.id]: http(process.env.NEXT_PUBLIC_RPC_URL_AVALANCHE_FUJI),
      [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_RPC_URL_POLYGON_AMOY),
    },
    ssr: true,
  });
}

export const wagmiConfig: WagmiConfig =
  globalThis.__wagmiConfig ?? (globalThis.__wagmiConfig = createWagmiConfig());
