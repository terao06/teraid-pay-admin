import type { Metadata } from "next";
import { Noto_Sans_JP, Space_Grotesk } from "next/font/google";
import { AppThemeProvider } from "@/components/theme-provider";
import { Web3Providers } from "@/components/web3-providers";
import "./globals.css";

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = Noto_Sans_JP({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

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
    <html
      lang="ja"
      className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Web3Providers>
          <AppThemeProvider>{children}</AppThemeProvider>
        </Web3Providers>
      </body>
    </html>
  );
}
