import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { mainnet, polygon, polygonAmoy, sepolia } from "wagmi/chains";

type WagmiConfig = ReturnType<typeof getDefaultConfig>;

declare global {
  var __wagmiConfig: WagmiConfig | undefined;
}

function createWagmiConfig(): WagmiConfig {
  return getDefaultConfig({
    appName: "Teraid Pay Admin",
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "",
    chains: [polygon, polygonAmoy, sepolia, mainnet],
    transports: {
      [mainnet.id]: http(process.env.NEXT_PUBLIC_RPC_URL_ETHEREUM_MAINNET),
      [polygon.id]: http(process.env.NEXT_PUBLIC_RPC_URL_POLYGON_MAINNET),
      [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_RPC_URL_POLYGON_AMOY),
      [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL_ETHEREUM_SEPOLIA),
    },
    ssr: true,
  });
}

export const wagmiConfig: WagmiConfig =
  globalThis.__wagmiConfig ?? (globalThis.__wagmiConfig = createWagmiConfig());
