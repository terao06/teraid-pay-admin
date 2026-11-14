import type { Metadata } from "next";
import { AppThemeProvider } from "@/components/theme-provider";
import { Web3Providers } from "@/components/web3-providers";
import { AuthProvider } from "@/features/store-wallet/auth/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "TeraiD Pay Admin",
  description: "Wallet linking dashboard for TeraiD Pay store administrators.",
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
          <AppThemeProvider>
            <AuthProvider>{children}</AuthProvider>
          </AppThemeProvider>
        </Web3Providers>
      </body>
    </html>
  );
}
