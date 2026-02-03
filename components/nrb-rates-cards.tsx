"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Wallet, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

interface NRBRate {
    currency: {
        iso3: string;
        name: string;
        unit: number;
    };
    buy: string | number;
    sell: string | number;
}

interface NRBRatesCardsProps {
    rates: NRBRate[];
    lastUpdated?: string;
}

export function NRBRatesCards({ rates, lastUpdated }: NRBRatesCardsProps) {
    if (!rates || rates.length === 0) return null;

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-bold">Official NRB Exchange Rates</h2>
                </div>
                {lastUpdated && (
                    <span className="text-xs text-muted-foreground">
                        {new Date(lastUpdated).toLocaleDateString()}
                    </span>
                )}
            </div>

            {/* Horizontal Scrollable Container */}
            <div className="relative">
                {/* Gradient fade on left */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />

                {/* Gradient fade on right */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                {/* Scrollable cards container */}
                <div
                    className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-transparent hover:scrollbar-thumb-blue-600"
                    dir="rtl"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#3b82f6 transparent'
                    }}
                >
                    {rates.map((rate) => {
                        const buyNum = typeof rate.buy === 'string' ? parseFloat(rate.buy) : rate.buy;
                        const sellNum = typeof rate.sell === 'string' ? parseFloat(rate.sell) : rate.sell;

                        return (
                            <Card
                                key={rate.currency.iso3}
                                className="flex-shrink-0 w-[160px] hover:shadow-md transition-shadow border-t-2 border-t-blue-500"
                                dir="ltr"
                            >
                                <CardContent className="p-3">
                                    {/* Currency Header - Compact */}
                                    <div className="mb-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                                                {rate.currency.iso3}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {rate.currency.unit}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-xs text-foreground truncate">
                                            {rate.currency.name}
                                        </h3>
                                    </div>

                                    {/* Buy Rate - Vertical Compact */}
                                    <div className="mb-2 p-2 rounded bg-green-50 dark:bg-green-950/20">
                                        <div className="flex items-center gap-1 mb-0.5">
                                            <ArrowDownCircle className="h-3 w-3 text-green-600" />
                                            <span className="text-[10px] font-medium text-green-700 dark:text-green-400">
                                                Buy
                                            </span>
                                        </div>
                                        <div className="font-bold text-sm text-green-700 dark:text-green-400">
                                            {buyNum.toFixed(2)}
                                        </div>
                                    </div>

                                    {/* Sell Rate - Vertical Compact */}
                                    <div className="p-2 rounded bg-red-50 dark:bg-red-950/20">
                                        <div className="flex items-center gap-1 mb-0.5">
                                            <ArrowUpCircle className="h-3 w-3 text-red-600" />
                                            <span className="text-[10px] font-medium text-red-700 dark:text-red-400">
                                                Sell
                                            </span>
                                        </div>
                                        <div className="font-bold text-sm text-red-700 dark:text-red-400">
                                            {sellNum.toFixed(2)}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            <div className="mt-3 text-[10px] text-center text-muted-foreground">
                Source: Nepal Rastra Bank • Updated daily at 11:00 AM NPT
            </div>
        </div>
    );
}
