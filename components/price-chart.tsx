"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceHistory } from "@/lib/types";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { format } from "date-fns";

interface PriceChartProps {
    data: PriceHistory[];
    title: string;
    color?: string;
    currency?: string;
}

export function PriceChart({
    data,
    title,
    color = "#eab308",
    currency = "NPR",
}: PriceChartProps) {
    const formattedData = data.map((item) => ({
        ...item,
        date: format(new Date(item.date), "MMM dd"),
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={formattedData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="date"
                                className="text-xs"
                                tick={{ fill: "hsl(var(--muted-foreground))" }}
                            />
                            <YAxis
                                className="text-xs"
                                tick={{ fill: "hsl(var(--muted-foreground))" }}
                                tickFormatter={(value) =>
                                    new Intl.NumberFormat("en", {
                                        notation: "compact",
                                        compactDisplay: "short",
                                    }).format(value)
                                }
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                }}
                                labelStyle={{ color: "hsl(var(--foreground))" }}
                                formatter={(value: number) =>
                                    value !== undefined
                                        ? new Intl.NumberFormat("en-NP", {
                                            style: "currency",
                                            currency: currency,
                                        }).format(value)
                                        : ""
                                }
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="price"
                                stroke={color}
                                strokeWidth={2}
                                dot={false}
                                name="Price"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
