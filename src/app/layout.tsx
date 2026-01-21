import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@coinbase/onchainkit/styles.css";
import { Providers } from "@/components/Providers";
import { FarcasterSDK } from "@/components/FarcasterSDK";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const appUrl = process.env.NEXT_PUBLIC_URL || "https://luckybase.app";
  return {
    title: "LuckyBase - P2P Gaming on Base",
    description: "Decentralized 1v1 Dice Games on Base",
    other: {
      "fc:miniapp": JSON.stringify({
        version: "next",
        imageUrl: `${appUrl}/og-image.png`,
        button: {
          title: "Play LuckyBase",
          action: {
            type: "launch_miniapp",
            name: "LuckyBase",
            url: appUrl,
            splashImageUrl: `${appUrl}/splash.png`,
            splashBackgroundColor: "#0052FF",
          },
        },
      }),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
      >
        <Providers>
          <FarcasterSDK />
          <div className="min-h-screen flex justify-center">
            <div className="w-full max-w-[480px] min-h-screen bg-background flex flex-col relative border-x border-base-blue/5 shadow-2xl">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
