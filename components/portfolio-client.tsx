"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Plus, Trash2, TrendingUp, TrendingDown, Coins, Wallet, Download } from "lucide-react";
import { PrivacyBlur } from "@/components/privacy-blur";
import { useRefresh } from "@/contexts/refresh-context";
import { PortfolioTransaction, PriceHistory } from "@/lib/types";
import { PriceChart } from "@/components/price-chart";
import { useMediaQuery } from "@/hooks/use-media-query";

interface PortfolioClientProps {
    initialRates: { gold: number; silver: number; date: string };
    initialHistory: { gold: PriceHistory[]; silver: PriceHistory[] };
    initialTransactions?: PortfolioTransaction[];
}

export function PortfolioClient({ initialRates, initialHistory, initialTransactions = [] }: PortfolioClientProps) {
    const { registerRefreshHandler } = useRefresh();
    const [transactions, setTransactions] = useState<PortfolioTransaction[]>(initialTransactions);
    const [selectedTransaction, setSelectedTransaction] = useState<PortfolioTransaction | null>(null);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const rates = initialRates;
    const history = initialHistory;

    const fetchTransactions = useCallback(async () => {
        try {
            const response = await fetch(`/api/portfolio?t=${Date.now()}`, {
                headers: {
                    "Cache-Control": "no-cache",
                    "Pragma": "no-cache"
                }
            });
            if (response.ok) {
                const data = await response.json();
                setTransactions(data.transactions || []);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    }, []);

    // Load Data from Database
    useEffect(() => {
        if (initialTransactions.length === 0) {
            // checkMigration(); 
        }

        registerRefreshHandler(fetchTransactions);
    }, [registerRefreshHandler, fetchTransactions, initialTransactions.length]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this record?")) {
            return;
        }

        try {
            const response = await fetch(`/api/portfolio/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                const newTx = transactions.filter(t => t.id !== id);
                setTransactions(newTx);
                setSelectedTransaction(null);
            } else if (response.status === 401) {
                const newTx = transactions.filter(t => t.id !== id);
                setTransactions(newTx);
                localStorage.setItem("portfolio_transactions", JSON.stringify(newTx));
                setSelectedTransaction(null);
            } else {
                alert('Failed to delete transaction');
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            const newTx = transactions.filter(t => t.id !== id);
            setTransactions(newTx);
            localStorage.setItem("portfolio_transactions", JSON.stringify(newTx));
            setSelectedTransaction(null);
        }
    };

    // Calculations
    const calculateHoldings = () => {
        let goldQty = 0;
        let silverQty = 0;
        let totalCost = 0;
        let totalSoldValue = 0;

        transactions.forEach(tx => {
            const qty = tx.metal === 'gold' ?
                (tx.unit === 'gram' ? tx.quantity / 11.66 : tx.quantity) :
                (tx.unit === 'gram' ? tx.quantity / 11.66 : tx.quantity);

            if (tx.type === 'buy') {
                if (tx.metal === 'gold') goldQty += qty;
                else silverQty += qty;
                totalCost += tx.price;
            } else {
                if (tx.metal === 'gold') goldQty -= qty;
                else silverQty -= qty;
                totalSoldValue += tx.price;
            }
        });

        const goldValue = goldQty * rates.gold;
        const silverValue = silverQty * rates.silver;
        const currentValue = goldValue + silverValue;
        const netCost = totalCost - totalSoldValue;
        const profit = currentValue - netCost;
        const profitPercent = netCost > 0 ? (profit / netCost) * 100 : 0;

        return { goldQty, silverQty, totalCost, currentValue, profit, profitPercent, netCost };
    };

    const stats = calculateHoldings();
    const isProfit = stats.profit >= 0;

    const portfolioHistory = useMemo(() => {
        if (!history.gold.length) return [];
        return history.gold.map((h) => {
            const date = h.date;
            const goldPrice = h.price;
            const silverPrice = history.silver.find(s => s.date === date)?.price || 0;
            const val = (stats.goldQty * goldPrice) + (stats.silverQty * silverPrice);
            return { date, price: val };
        });
    }, [history, stats.goldQty, stats.silverQty]);

    function TransactionDetailsList({ transaction }: { transaction: PortfolioTransaction }) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${transaction.type === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {transaction.type === 'buy' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Transaction Type</div>
                        <div className="font-semibold capitalize text-lg">{transaction.type}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                        <div className="text-sm text-muted-foreground">Metal</div>
                        <div className="font-medium capitalize">{transaction.metal}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Unit</div>
                        <div className="font-medium capitalize">{transaction.unit}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm text-muted-foreground">Quantity</div>
                        <div className="font-medium">{transaction.quantity}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Rate per {transaction.unit}</div>
                        <div className="font-medium">
                            <PrivacyBlur>Rs {transaction.rate?.toLocaleString()}</PrivacyBlur>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground">Total Price</div>
                    <div className="text-2xl font-bold">
                        <PrivacyBlur>Rs {transaction.price.toLocaleString()}</PrivacyBlur>
                    </div>
                </div>

                <div>
                    <div className="text-sm text-muted-foreground">Date</div>
                    <div className="font-medium">{transaction.date}</div>
                </div>

                {transaction.notes && (
                    <div>
                        <div className="text-sm text-muted-foreground">Notes</div>
                        <div className="font-medium">{transaction.notes}</div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            <div className="container py-8 max-w-5xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Gold Silver Portfolio</h1>
                        <p className="text-muted-foreground mt-1">
                            Track your gold and silver assets in real-time.
                        </p>
                    </div>
                    <div className="text-right hidden md:block">
                        <div className="text-sm text-muted-foreground">Current Market Rates ({rates.date})</div>
                        <div className="font-medium">Gold: NPR {rates.gold.toLocaleString()} / Tola</div>
                        <div className="font-medium">Silver: NPR {rates.silver.toLocaleString()} / Tola</div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                <PrivacyBlur>Rs {stats.netCost.toLocaleString()}</PrivacyBlur>
                            </div>
                            <p className="text-xs text-muted-foreground">Net cost basis</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
                            <Coins className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                <PrivacyBlur>Rs {stats.currentValue.toLocaleString()}</PrivacyBlur>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                <PrivacyBlur>
                                    Gold: {stats.goldQty.toFixed(2)} Tola • Silver: {stats.silverQty.toFixed(2)} Tola
                                </PrivacyBlur>
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Profit / Loss</CardTitle>
                            {isProfit ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${isProfit ? "text-green-600" : "text-red-600"}`}>
                                <PrivacyBlur>{isProfit ? "+" : ""}Rs {stats.profit.toLocaleString()}</PrivacyBlur>
                            </div>
                            <p className={`text-xs ${isProfit ? "text-green-600" : "text-red-600"}`}>
                                <PrivacyBlur>
                                    {isProfit ? "+" : ""}{stats.profitPercent.toFixed(2)}% Return
                                </PrivacyBlur>
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Portfolio Chart */}
                {portfolioHistory.length > 0 && stats.currentValue > 0 && (
                    <div className="mb-8">
                        <PriceChart
                            data={portfolioHistory}
                            title="Portfolio Performance (Last 30 Days)"
                            color={isProfit ? "#16a34a" : "#dc2626"}
                            privacySensitive={true}
                        />
                    </div>
                )}

                {/* Transaction History */}
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <h2 className="text-2xl font-bold">Transaction History</h2>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => import("@/lib/export-utils").then(m => m.exportTransactionsToCSV(transactions))}
                            title="Export to CSV"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                        <Link href="/portfolio/add">
                            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="h-4 w-4" /> Add Transaction
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        {transactions.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No transactions yet. Add your first investment!
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {transactions.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                                        onClick={() => setSelectedTransaction(tx)}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* B/S Avatar */}
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 font-bold text-lg ${tx.type === 'buy'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {tx.type === 'buy' ? 'B' : 'S'}
                                            </div>

                                            {/* Metal & Quantity */}
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-base capitalize text-foreground">
                                                    {tx.metal}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {tx.quantity} {tx.unit}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Price Only */}
                                        <div className="font-bold text-lg whitespace-nowrap">
                                            <PrivacyBlur>Rs {tx.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</PrivacyBlur>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Transaction Details Sheet (Desktop) / Drawer (Mobile) */}
                {isDesktop ? (
                    <Sheet open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
                        <SheetContent side="right">
                            <SheetHeader>
                                <SheetTitle>Transaction Details</SheetTitle>
                                <SheetDescription>View transaction information</SheetDescription>
                            </SheetHeader>
                            {selectedTransaction && (
                                <div className="py-6">
                                    <TransactionDetailsList transaction={selectedTransaction} />
                                    <div className="mt-6 pt-6 border-t">
                                        <Button
                                            variant="destructive"
                                            className="w-full"
                                            onClick={() => handleDelete(selectedTransaction.id)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> Delete Transaction
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </SheetContent>
                    </Sheet>
                ) : (
                    <Drawer open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
                        <DrawerContent>
                            <DrawerTitle className="sr-only">Transaction Details</DrawerTitle>
                            <DrawerDescription className="sr-only">View transaction information</DrawerDescription>
                            <div className="mx-auto w-full max-w-sm pt-6">
                                {selectedTransaction && (
                                    <div className="px-4">
                                        <TransactionDetailsList transaction={selectedTransaction} />
                                    </div>
                                )}
                                <DrawerFooter>
                                    {selectedTransaction && (
                                        <Button
                                            variant="destructive"
                                            className="w-full"
                                            onClick={() => handleDelete(selectedTransaction.id)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> Delete Transaction
                                        </Button>
                                    )}
                                    <DrawerClose asChild>
                                        <Button variant="outline">Close</Button>
                                    </DrawerClose>
                                </DrawerFooter>
                            </div>
                        </DrawerContent>
                    </Drawer>
                )}
            </div>
        </div>
    );
}
