"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, TrendingUp, TrendingDown, Coins, Wallet } from "lucide-react";
import { PortfolioTransaction, PriceHistory } from "@/lib/types";
import { PriceChart } from "@/components/price-chart";

interface PortfolioClientProps {
    initialRates: { gold: number; silver: number; date: string };
    initialHistory: { gold: PriceHistory[]; silver: PriceHistory[] };
}

export function PortfolioClient({ initialRates, initialHistory }: PortfolioClientProps) {
    const [transactions, setTransactions] = useState<PortfolioTransaction[]>([]);
    const [rates, setRates] = useState(initialRates);
    const [history, setHistory] = useState(initialHistory);
    // Remove individual rateDate state as it's part of rates now
    const [loading, setLoading] = useState(false); // No longer loading initial data
    const [showAddForm, setShowAddForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<PortfolioTransaction>>({
        type: 'buy',
        metal: 'gold',
        unit: 'tola',
        quantity: 1,
        date: new Date().toISOString().split('T')[0]
    });

    // 1. Load Data
    useEffect(() => {
        // Load transactions from local storage
        const saved = localStorage.getItem("portfolio_transactions");
        if (saved) {
            try { setTransactions(JSON.parse(saved)); } catch (e) { }
        }
    }, []);

    // 2. Save Data
    useEffect(() => {
        if (transactions.length > 0) {
            localStorage.setItem("portfolio_transactions", JSON.stringify(transactions));
        }
    }, [transactions]);

    // 3. Handlers
    const handleAddTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        const price = Number(formData.price) || 0;
        const rate = Number(formData.rate) || 0;
        // If user didn't enter total price, calculate from rate
        const finalPrice = price > 0 ? price : (rate * (Number(formData.quantity) || 0));

        // If user didn't enter rate, calculate from price
        const finalRate = rate > 0 ? rate : (price / (Number(formData.quantity) || 1));

        const newTx: PortfolioTransaction = {
            id: Date.now().toString(),
            type: formData.type as 'buy' | 'sell',
            metal: formData.metal as 'gold' | 'silver',
            unit: formData.unit as 'tola' | 'gram',
            quantity: Number(formData.quantity) || 0,
            price: finalPrice,
            rate: finalRate,
            date: formData.date || new Date().toISOString(),
            notes: formData.notes || ''
        };

        setTransactions([newTx, ...transactions]);
        setShowAddForm(false);
        // Reset form slightly
        setFormData({ ...formData, price: undefined, rate: undefined, notes: '' });
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this record?")) {
            const newTx = transactions.filter(t => t.id !== id);
            setTransactions(newTx);
            localStorage.setItem("portfolio_transactions", JSON.stringify(newTx));
        }
    };

    // 4. Calculations
    const calculateHoldings = () => {
        let goldQty = 0;
        let silverQty = 0;
        let totalCost = 0;
        let totalSoldValue = 0;

        transactions.forEach(tx => {
            const qty = tx.metal === 'gold' ?
                (tx.unit === 'gram' ? tx.quantity / 11.66 : tx.quantity) : // Convert gram to Tola (approx)
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

        // Current Value
        const goldValue = goldQty * rates.gold;
        const silverValue = silverQty * rates.silver;
        const currentValue = goldValue + silverValue;

        // Adjusted Cost (Simplistic: Total Buy Cost - Total Sell Value)
        // For accurate tracking we'd need FIFO/LIFO, but this is a simple tracker
        const netCost = totalCost - totalSoldValue;
        const profit = currentValue - netCost;
        const profitPercent = netCost > 0 ? (profit / netCost) * 100 : 0;

        return { goldQty, silverQty, totalCost, currentValue, profit, profitPercent, netCost };
    };

    const stats = calculateHoldings();
    const isProfit = stats.profit >= 0;

    // Calculate historical value of CURRENT holdings
    const portfolioHistory = useMemo(() => {
        if (!history.gold.length) return [];
        return history.gold.map((h) => {
            const date = h.date;
            const goldPrice = h.price;
            const silverPrice = history.silver.find(s => s.date === date)?.price || 0;

            // Value = (Qty * Price)
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

                {/* Main Content Area */}
                <div className="grid gap-8 md:grid-cols-3">
                    {/* Left: Transaction Form */}
                    <div className="md:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Add Transaction</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAddTransaction} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Type</label>
                                            <select
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                                value={formData.type}
                                                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                            >
                                                <option value="buy">Buy</option>
                                                <option value="sell">Sell</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Metal</label>
                                            <select
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                                value={formData.metal}
                                                onChange={e => setFormData({ ...formData, metal: e.target.value as any })}
                                            >
                                                <option value="gold">Gold</option>
                                                <option value="silver">Silver</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Quantity</label>
                                            <input
                                                type="number" step="0.01"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={formData.quantity}
                                                onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Unit</label>
                                            <select
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                                value={formData.unit}
                                                onChange={e => setFormData({ ...formData, unit: e.target.value as any })}
                                            >
                                                <option value="tola">Tola</option>
                                                <option value="gram">Gram</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Rate per Tola/Unit (NPR)</label>
                                        <input
                                            type="number"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={formData.rate || ''}
                                            onChange={e => setFormData({ ...formData, rate: Number(e.target.value) })}
                                            placeholder="e.g. 150000"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-sm font-medium">Total Price (NPR)</label>
                                            <span className="text-xs text-muted-foreground">Auto-calculated if empty</span>
                                        </div>
                                        <input
                                            type="number"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={formData.price || ''}
                                            onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                            placeholder="Total Amount"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Date</label>
                                        <input
                                            type="date"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <Button type="submit" className="w-full flex items-center gap-2">
                                        <Plus className="h-4 w-4" /> Add Transaction
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Transactions List */}
                    <div className="md:col-span-2">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>Transaction History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {transactions.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        No transactions yet. Add your first investment!
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {transactions.map((tx) => (
                                            <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
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
                                                        onClick={() => handleDelete(tx.id)}
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
                    </div>
                </div>
            </div>
        </div>
    );
}
