"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, TrendingUp, TrendingDown, Coins, Wallet } from "lucide-react";
import { useRefresh } from "@/contexts/refresh-context";
import { PortfolioTransaction, PriceHistory } from "@/lib/types";
import { PriceChart } from "@/components/price-chart";
import { migrateLocalStorageToDatabase } from "@/lib/migrate-portfolio";

interface PortfolioClientProps {
    initialRates: { gold: number; silver: number; date: string };
    initialHistory: { gold: PriceHistory[]; silver: PriceHistory[] };
    initialTransactions?: PortfolioTransaction[];
}

export function PortfolioClient({ initialRates, initialHistory, initialTransactions = [] }: PortfolioClientProps) {
    const { registerRefreshHandler } = useRefresh();
    // Use initialTransactions if available, otherwise empty array
    const [transactions, setTransactions] = useState<PortfolioTransaction[]>(initialTransactions);
    // If we have initial transactions, we are not loading. If it's empty, we might naturally be empty or loading?
    // Actually, since we pass data from server, we can say isLoading = false initially.
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<PortfolioTransaction | null>(null);
    const rates = initialRates;
    const history = initialHistory;

    const fetchTransactions = useCallback(async () => {
        try {
            // Don't set isLoading to true for background refreshes to avoid UI flicker
            // setIsLoading(true); 
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
        // If initialTransactions is empty, we MIGHT want to fetch, but usually server is source of truth.
        // But for migration from localStorage logic, we should check once.
        if (initialTransactions.length === 0) {
            // checkMigration(); // Refactored migration logic below
        }

        // Always register refresh handler
        registerRefreshHandler(fetchTransactions);

        // We do NOT call fetchTransactions() on mount because we have initial data from server!
        // Unless we suspect server data is stale, but we set revalidate=0.
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
            } else if (response.status === 401) {
                const newTx = transactions.filter(t => t.id !== id);
                setTransactions(newTx);
                localStorage.setItem("portfolio_transactions", JSON.stringify(newTx));
            } else {
                alert('Failed to delete transaction');
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            const newTx = transactions.filter(t => t.id !== id);
            setTransactions(newTx);
            localStorage.setItem("portfolio_transactions", JSON.stringify(newTx));
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
                            <div className="text-2xl font-bold">Rs {stats.netCost.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Net cost basis</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
                            <Coins className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Rs {stats.currentValue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                Gold: {stats.goldQty.toFixed(2)} Tola • Silver: {stats.silverQty.toFixed(2)} Tola
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
                                {isProfit ? "+" : ""}Rs {stats.profit.toLocaleString()}
                            </div>
                            <p className={`text-xs ${isProfit ? "text-green-600" : "text-red-600"}`}>
                                {isProfit ? "+" : ""}{stats.profitPercent.toFixed(2)}% Return
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
                        />
                    </div>
                )}

                {/* Transaction History */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Transaction History</h2>
                    <Link href="/portfolio/add">
                        <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="h-4 w-4" /> Add Transaction
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        {isLoading ? (
                            <div className="text-center py-12 text-muted-foreground">
                                Loading transactions...
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No transactions yet. Add your first investment!
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {transactions.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                        onClick={() => setSelectedTransaction(tx)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${tx.type === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {tx.type === 'buy' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <div className="font-medium capitalize">
                                                    {tx.type} {tx.quantity} {tx.unit} {tx.metal}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    @ Rs {tx.rate?.toLocaleString()} / {tx.unit} • {tx.date}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">Rs {tx.price.toLocaleString()}</div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(tx.id);
                                                }}
                                                className="text-xs text-red-500 hover:text-red-700 mt-1 flex items-center justify-end gap-1"
                                            >
                                                <Trash2 className="h-3 w-3" /> Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Transaction Details Bottom Sheet */}
                {selectedTransaction && (
                    <div
                        className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-in fade-in duration-200"
                        onClick={() => setSelectedTransaction(null)}
                    >
                        <div
                            className="bg-background rounded-t-2xl shadow-lg w-full max-w-2xl p-6 pb-8 animate-in slide-in-from-bottom duration-300"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Handle bar */}
                            <div className="flex justify-center mb-4">
                                <div className="w-12 h-1 bg-muted-foreground/30 rounded-full"></div>
                            </div>

                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-2xl font-bold">Transaction Details</h3>
                                <button
                                    onClick={() => setSelectedTransaction(null)}
                                    className="text-muted-foreground hover:text-foreground text-2xl leading-none"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-full ${selectedTransaction.type === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {selectedTransaction.type === 'buy' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Transaction Type</div>
                                        <div className="font-semibold capitalize text-lg">{selectedTransaction.type}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Metal</div>
                                        <div className="font-medium capitalize">{selectedTransaction.metal}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Unit</div>
                                        <div className="font-medium capitalize">{selectedTransaction.unit}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Quantity</div>
                                        <div className="font-medium">{selectedTransaction.quantity}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Rate per {selectedTransaction.unit}</div>
                                        <div className="font-medium">Rs {selectedTransaction.rate?.toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="text-sm text-muted-foreground">Total Price</div>
                                    <div className="text-2xl font-bold">Rs {selectedTransaction.price.toLocaleString()}</div>
                                </div>

                                <div>
                                    <div className="text-sm text-muted-foreground">Date</div>
                                    <div className="font-medium">{selectedTransaction.date}</div>
                                </div>

                                {selectedTransaction.notes && (
                                    <div>
                                        <div className="text-sm text-muted-foreground">Notes</div>
                                        <div className="font-medium">{selectedTransaction.notes}</div>
                                    </div>
                                )}

                                <div className="pt-4 border-t">
                                    <Button
                                        variant="destructive"
                                        className="w-full"
                                        onClick={() => {
                                            setSelectedTransaction(null);
                                            handleDelete(selectedTransaction.id);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" /> Delete Transaction
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
