import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  webpack: (config) => {
    // wagmi 2.19+ の tempo コネクタが要求する 'accounts' パッケージを
    // 空スタブに置き換える（tempo コネクタを使用しない場合に必要）
    config.resolve.alias = {
      ...config.resolve.alias,
      accounts: path.join(process.cwd(), "lib/empty-module.js"),
      "@react-native-async-storage/async-storage": path.join(process.cwd(), "lib/empty-module.js"),
    };
    return config;
  },
};

export default nextConfig;
