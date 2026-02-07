import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Metadata } from "next";
import { MarketChart } from "@/components/market-chart";

export const metadata: Metadata = {
    title: "Market Analysis - Gold & Silver Price Tracker",
    description: "Advanced live market charts for Gold, Silver, and global commodities with technical analysis tools.",
};

export default function MarketPage() {
    return (
        <div className="container py-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Market Analysis</h1>
                <p className="text-muted-foreground">
                    Real-time advanced charting for Gold, Silver, Currency, Oil, and Bitcoin.
                </p>
            </div>

            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
                <MarketChart />
            </Suspense>
        </div>
    );
}
