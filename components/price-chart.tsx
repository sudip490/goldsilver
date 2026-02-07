"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceHistory } from "@/lib/types";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { format, subDays, isAfter } from "date-fns";
import { usePrivacy } from "@/contexts/privacy-context";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { PriceAlertDialog } from "@/components/price-alert-dialog";

interface PriceChartProps {
    data: PriceHistory[];
    title: string;
    color?: string;
    currency?: string;
    privacySensitive?: boolean;
}

type Timeframe = "1W" | "1M" | "6M" | "1Y" | "ALL";

export function PriceChart({
    data,
    title,
    color = "#eab308",
    currency = "NPR",
    privacySensitive = false,
}: PriceChartProps) {
    const { isPrivacyMode } = usePrivacy();
    const [timeframe, setTimeframe] = useState<Timeframe>("1M");


    // Filter data based on selected timeframe
    const filteredData = useMemo(() => {
        if (timeframe === "ALL") return data;

        const now = new Date();
        let daysToSubtract = 30;

        switch (timeframe) {
            case "1W":
                daysToSubtract = 7;
                break;
            case "1M":
                daysToSubtract = 30;
                break;
            case "6M":
                daysToSubtract = 180;
                break;
            case "1Y":
                daysToSubtract = 365;
                break;
        }

        const cutoffDate = subDays(now, daysToSubtract);

        return data.filter((item) => {
            const itemDate = new Date(item.date);
            return isAfter(itemDate, cutoffDate);
        });
    }, [data, timeframe]);

    const formattedData = filteredData.map((item) => ({
        ...item,
        date: item.date,
    }));

    // Get the latest price for the alert dialog
    const currentPrice = data.length > 0 ? data[data.length - 1].price : 0;
    const metalName = title.toLowerCase().includes("gold") ? "Gold" : "Silver";

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-normal">{title}</CardTitle>
                <div className="flex items-center space-x-2">
                    <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)} className="hidden sm:block">
                        <TabsList className="grid h-8 w-full grid-cols-5 bg-muted/50 p-0.5">
                            <TabsTrigger value="1W" className="h-7 text-xs px-2">1W</TabsTrigger>
                            <TabsTrigger value="1M" className="h-7 text-xs px-2">1M</TabsTrigger>
                            <TabsTrigger value="6M" className="h-7 text-xs px-2">6M</TabsTrigger>
                            <TabsTrigger value="1Y" className="h-7 text-xs px-2">1Y</TabsTrigger>
                            <TabsTrigger value="ALL" className="h-7 text-xs px-2">ALL</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    {/* Mobile dropdown or smaller tabs could be added here for small screens if needed, 
                        currently hiding tabs on very small screens to prevent overflow or using scrolling */}
                    <div className="sm:hidden">
                        <select
                            className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                        >
                            <option value="1W">1W</option>
                            <option value="1M">1M</option>
                            <option value="6M">6M</option>
                            <option value="1Y">1Y</option>
                            <option value="ALL">ALL</option>
                        </select>
                    </div>

                    <PriceAlertDialog
                        currentPrice={currentPrice}
                        currency={currency}
                        metal={metalName}
                        trigger={
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <Bell className="h-4 w-4" />
                                <span className="sr-only">Set Alert</span>
                            </Button>
                        }
                    />
                </div>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                <div className={cn(
                    "h-[300px] w-full transition-all duration-300 mt-4",
                    isPrivacyMode && privacySensitive && "filter blur-md hover:blur-none"
                )}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                            <XAxis
                                dataKey="date"
                                className="text-xs"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: "hsl(var(--muted-foreground))" }}
                                minTickGap={30}
                                tickFormatter={(value) => format(new Date(value), "MMM dd")}
                            />
                            <YAxis
                                width={50}
                                domain={["auto", "auto"]}
                                className="text-xs"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: "hsl(var(--muted-foreground))" }}
                                tickFormatter={(value) =>
                                    new Intl.NumberFormat("en", {
                                        notation: "compact",
                                        compactDisplay: "short",
                                    }).format(value)
                                }
                            />
                            <Tooltip
                                labelFormatter={(value) => format(new Date(value), "MMM dd, yyyy")}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold", marginBottom: "0.25rem" }}
                                separator=": "
                                formatter={(value: number) => [
                                    value !== undefined
                                        ? new Intl.NumberFormat("en-NP", {
                                            style: "currency",
                                            currency: currency,
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                        }).format(value)
                                        : "",
                                    "Price"
                                ]}
                            />
                            <Area
                                type="monotone"
                                dataKey="price"
                                stroke={color}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 0 }}
                                fill={`url(#gradient-${color})`}
                            />
                            <defs>
                                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.1} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
