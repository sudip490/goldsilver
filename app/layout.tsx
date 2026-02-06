import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header } from "@/components/header";
import { GlobalRefreshButton } from "@/components/global-refresh-button";
import { RefreshProvider } from "@/contexts/refresh-context";
import { ThemeProvider } from "@/components/theme-provider";
import { MobileNav } from "@/components/mobile-nav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
    themeColor: "#000000",
};

export const metadata: Metadata = {
    title: "Gold & Silver Price Tracker - Nepal & Global Markets",
    description:
        "Track real-time gold and silver prices in Nepal and around the world. Get daily updates, historical charts, and market news.",
    keywords: [
        "gold price",
        "silver price",
        "Nepal gold rate",
        "precious metals",
        "gold price today",
        "silver rate",
        "metal market",
    ],
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "GoldSilver",
    },
    icons: {
        icon: "/icon-192x192.png",
        apple: "/icon-192x192.png",
        shortcut: "/icon-192x192.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <RefreshProvider>
                        <Header />
                        <GlobalRefreshButton />
                        <div className="pt-16 pb-24 md:pb-0 min-h-screen">
                            {children}
                        </div>
                        <MobileNav />
                    </RefreshProvider>
                    <Analytics />
                    <SpeedInsights />
                </ThemeProvider>
            </body>
        </html>
    );
}
