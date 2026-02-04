import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header } from "@/components/header";
import { RefreshProvider } from "@/contexts/refresh-context";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
                        <div className="pt-16">
                            {children}
                        </div>
                    </RefreshProvider>
                    <Analytics />
                    <SpeedInsights />
                </ThemeProvider>
            </body>
        </html>
    );
}
