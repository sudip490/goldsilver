"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, RefreshCw } from "lucide-react";

interface SimpleExchangeRatesProps {
    rates: Record<string, number>;
    lastUpdated: string;
}

export function SimpleExchangeRates({ rates, lastUpdated }: SimpleExchangeRatesProps) {
    if (!rates) return null;

    // Filter out USD (since it's base) and sort keys
    const sortedCurrencies = Object.keys(rates)
        .filter(key => key !== 'USD')
        .sort((a, b) => {
            // Prioritize common currencies
            const priorities = ["NPR", "INR", "GBP", "EUR", "AUD", "AED", "CNY"];
            const idxA = priorities.indexOf(a);
            const idxB = priorities.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });

    console.log("SimpleExchangeRates received:", rates, "Sorted:", sortedCurrencies);

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Coins className="h-5 w-5 text-yellow-500" />
                    Exchange Rates
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <RefreshCw className="h-3 w-3" />
                    <span>Based on 1 USD</span>
                </div>
            </CardHeader>
            <CardContent>
                {sortedCurrencies.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                        No exchange rate data available.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {sortedCurrencies.map((currency) => {
                            const rate = rates[currency];
                            if (!rate) return null;

                            return (
                                <div key={currency} className="flex flex-col p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                                    <div className="text-sm font-medium text-muted-foreground mb-1">
                                        USD to {currency}
                                    </div>
                                    <div className="text-lg font-bold">
                                        {rate.toFixed(2)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div className="mt-4 text-xs text-right text-muted-foreground">
                    Source: Nepal Rastra Bank (Official)
                </div>
            </CardContent>
        </Card>
    );
}
