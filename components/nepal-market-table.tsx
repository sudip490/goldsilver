"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface NepalMarketRate {
    key: string;
    name: string;
    unit: string;
    price: number;
    change?: number;
    changePercent?: number;
    date: string;
}

interface NepalMarketTableProps {
    rates: NepalMarketRate[];
}

export function NepalMarketTable({ rates }: NepalMarketTableProps) {
    if (!rates || rates.length === 0) return null;

    return (
        <Card className="w-full mt-6">
            <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <span className="text-2xl">🇳🇵</span> Nepal Market Official Rates
                    </CardTitle>
                    {rates.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            Updated: {rates[0].date}
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="text-left py-3 px-4 font-semibold text-muted-foreground w-[200px]">Metal</th>
                                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Unit</th>
                                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Price (NPR)</th>
                                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Change</th>
                                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rates.filter(rate => rate.price > 0).map((rate) => (
                                <tr
                                    key={rate.key}
                                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                                >
                                    <td className="py-3 px-4 font-medium">{rate.name}</td>
                                    <td className="py-3 px-4 text-muted-foreground">{rate.unit}</td>
                                    <td className="py-3 px-4 text-right font-bold font-mono text-base">
                                        {formatCurrency(rate.price, "NPR")}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        {rate.change !== undefined && rate.change !== 0 ? (
                                            <div className={`flex items-center justify-end gap-1 ${rate.change > 0 ? "text-green-600" : "text-red-600"}`}>
                                                {rate.change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                <span>{formatCurrency(rate.change, "NPR")}</span>
                                                <span className="text-xs opacity-80">({rate.changePercent?.toFixed(2)}%)</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-right text-muted-foreground">
                                        {rate.date}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
