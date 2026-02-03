"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetalPrice } from "@/lib/types";
import { formatCurrency, formatPercentage, formatTime } from "@/lib/utils";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceCardProps {
    data: MetalPrice;
    featured?: boolean;
}

export function PriceCard({ data, featured = false }: PriceCardProps) {
    const isPositive = data.change >= 0;
    const metalColor = data.metal === "gold" ? "gold" : "silver";

    return (
        <Card
            className={cn(
                "overflow-hidden transition-all hover:shadow-lg",
                featured && "border-2 border-primary"
            )}
        >
            <CardHeader
                className={cn(
                    "pb-3",
                    data.metal === "gold"
                        ? "bg-gradient-to-br from-gold-50 to-gold-100 dark:from-gold-900/20 dark:to-gold-800/20"
                        : "bg-gradient-to-br from-silver-50 to-silver-100 dark:from-silver-900/20 dark:to-silver-800/20"
                )}
            >
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold capitalize">
                            {data.metal}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            {data.country} • {data.unit}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div>
                        <div className="text-3xl font-bold">
                            {formatCurrency(data.price, data.currency)}
                        </div>
                        <div
                            className={cn(
                                "text-sm font-medium mt-1",
                                isPositive ? "text-green-600" : "text-red-600"
                            )}
                        >
                            {isPositive ? "+" : ""}
                            {formatCurrency(data.change, data.currency)}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                        <div>
                            <p className="text-xs text-muted-foreground">24h High</p>
                            <p className="text-sm font-semibold">
                                {formatCurrency(data.high24h, data.currency)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">24h Low</p>
                            <p className="text-sm font-semibold">
                                {formatCurrency(data.low24h, data.currency)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2">
                        <Clock className="h-3 w-3" />
                        Updated {formatTime(data.lastUpdated)}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
