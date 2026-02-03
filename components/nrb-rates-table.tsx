"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, Info } from "lucide-react";

interface NRBRate {
    currency: {
        iso3: string;
        name: string;
        unit: number;
    };
    buy: string | number;
    sell: string | number;
}

interface NRBRatesTableProps {
    rates: NRBRate[];
    lastUpdated?: string;
}

export function NRBRatesTable({ rates, lastUpdated }: NRBRatesTableProps) {
    if (!rates || rates.length === 0) return null;

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-blue-600" />
                    Official NRB Exchange Rates
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Info className="h-3 w-3" />
                    <span>Official Rates</span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40%]">Currency</TableHead>
                                <TableHead className="text-center">Unit</TableHead>
                                <TableHead className="text-right">Buy (NPR)</TableHead>
                                <TableHead className="text-right">Sell (NPR)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rates.map((rate) => (
                                <TableRow key={rate.currency.iso3}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{rate.currency.name}</span>
                                            <span className="text-xs text-muted-foreground">{rate.currency.iso3}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">{rate.currency.unit}</TableCell>
                                    <TableCell className="text-right font-medium text-green-600">
                                        {rate.buy}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-red-600">
                                        {rate.sell}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="mt-4 text-xs text-right text-muted-foreground">
                    Source: Nepal Rastra Bank (Official)
                    {lastUpdated && <span> • Last Updated: {new Date(lastUpdated).toLocaleDateString()}</span>}
                </div>
            </CardContent>
        </Card>
    );
}
