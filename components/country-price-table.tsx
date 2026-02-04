"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountryData } from "@/lib/types";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountryPriceTableProps {
    data: CountryData[];
}

export function CountryPriceTable({ data }: CountryPriceTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Global Prices by Country</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-2 md:px-4 font-semibold">Country</th>
                                <th className="text-right py-3 px-2 md:px-4 font-semibold">Gold</th>
                                <th className="text-right py-3 px-2 md:px-4 font-semibold">Change</th>
                                <th className="text-right py-3 px-2 md:px-4 font-semibold">Silver</th>
                                <th className="text-right py-3 px-2 md:px-4 font-semibold">Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((country) => (
                                <tr
                                    key={country.countryCode}
                                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                                >
                                    <td className="py-3 px-2 md:px-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">
                                                {getFlagEmoji(country.countryCode)}
                                            </span>
                                            <div>
                                                <div className="font-medium">{country.country}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {country.currency}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-right py-3 px-2 md:px-4 font-semibold">
                                        {formatCurrency(country.goldPrice, country.currency)}
                                        <div className="text-xs text-muted-foreground font-normal">
                                            {country.goldUnit}
                                        </div>
                                    </td>
                                    <td className="text-right py-3 px-2 md:px-4">
                                        <div
                                            className={cn(
                                                "inline-flex items-center gap-1 text-sm font-medium",
                                                country.goldChange >= 0
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            )}
                                        >
                                            {country.goldChange >= 0 ? (
                                                <TrendingUp className="h-3 w-3" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3" />
                                            )}
                                            {formatCurrency(country.goldChangeValue, country.currency)}
                                        </div>
                                    </td>
                                    <td className="text-right py-3 px-2 md:px-4 font-semibold">
                                        {formatCurrency(country.silverPrice, country.currency)}
                                        <div className="text-xs text-muted-foreground font-normal">
                                            {country.silverUnit}
                                        </div>
                                    </td>
                                    <td className="text-right py-3 px-2 md:px-4">
                                        <div
                                            className={cn(
                                                "inline-flex items-center gap-1 text-sm font-medium",
                                                country.silverChange >= 0
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            )}
                                        >
                                            {country.silverChange >= 0 ? (
                                                <TrendingUp className="h-3 w-3" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3" />
                                            )}
                                            {formatCurrency(country.silverChangeValue, country.currency)}
                                        </div>
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

function getFlagEmoji(countryCode: string): string {
    const codePoints = countryCode
        .toUpperCase()
        .split("")
        .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}
