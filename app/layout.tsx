import type { Metadata } from "next";
import { AppThemeProvider } from "@/components/theme-provider";
import { Web3Providers } from "@/components/web3-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Teraid Pay Admin",
  description: "Wallet linking dashboard for Teraid Pay store administrators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full">
        <Web3Providers>
          <AppThemeProvider>{children}</AppThemeProvider>
        </Web3Providers>
      </body>
    </html>
  );
}
