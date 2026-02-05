"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Plus, ArrowLeft } from "lucide-react";
import { PortfolioTransaction } from "@/lib/types";

interface AddTransactionFormProps {
    currentRates?: {
        gold: number;
        silver: number;
        date: string;
    };
}

export function AddTransactionForm({ currentRates }: AddTransactionFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState<Partial<PortfolioTransaction>>({
        type: 'buy',
        metal: 'gold',
        unit: 'tola',
        quantity: '' as unknown as number,
        rate: '' as unknown as number,
        date: new Date().toISOString().split('T')[0]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-fill rate handler
    const handleAutofillRate = () => {
        if (!currentRates) return;

        const metal = formData.metal || 'gold';
        const unit = formData.unit || 'tola';

        let rate = metal === 'gold' ? currentRates.gold : currentRates.silver;

        if (unit === 'gram') {
            // Convert Tola rate to Gram rate
            // 1 Tola = 11.66 Grams
            rate = rate / 11.66;
            // Round to 2 decimals
            rate = Math.round(rate * 100) / 100;
        }

        setFormData(prev => ({
            ...prev,
            rate: rate
        }));
    };

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const quantity = Number(formData.quantity) || 0;
        const ratePerTola = Number(formData.rate) || 0;
        const price = Number(formData.price) || 0;
        const unit = formData.unit as 'tola' | 'gram';

        // Validation: Must provide either rate or total price
        if (ratePerTola <= 0 && price <= 0) {
            setIsSubmitting(false);
            return;
        }

        // Validation: Quantity must be positive
        if (quantity <= 0) {
            setIsSubmitting(false);
            return;
        }

        // Convert rate based on unit
        const actualRate = unit === 'gram' ? ratePerTola / 11.66 : ratePerTola;

        // Calculate price
        const finalPrice = price > 0 ? price : (actualRate * quantity);

        // Store the actual rate used (converted if gram)
        const finalRate = price > 0 ? (price / quantity) : actualRate;

        const transactionData = {
            type: formData.type as 'buy' | 'sell',
            metal: formData.metal as 'gold' | 'silver',
            unit: formData.unit as 'tola' | 'gram',
            quantity: quantity,
            price: finalPrice,
            rate: finalRate,
            date: formData.date || new Date().toISOString(),
            notes: formData.notes || ''
        };

        try {
            const response = await fetch('/api/portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData),
            });

            if (response.ok) {
                // Redirect back to portfolio page
                router.push('/portfolio');
                router.refresh();
            } else if (response.status === 401) {
                // User not authenticated, save to localStorage
                const newTx: PortfolioTransaction = {
                    id: Date.now().toString(),
                    ...transactionData
                };
                const saved = localStorage.getItem("portfolio_transactions");
                const existing = saved ? JSON.parse(saved) : [];
                localStorage.setItem("portfolio_transactions", JSON.stringify([newTx, ...existing]));
                router.push('/portfolio');
                router.refresh();
            } else {
                alert('Failed to add transaction');
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
            // Fallback to localStorage
            const newTx: PortfolioTransaction = {
                id: Date.now().toString(),
                ...transactionData
            };
            const saved = localStorage.getItem("portfolio_transactions");
            const existing = saved ? JSON.parse(saved) : [];
            localStorage.setItem("portfolio_transactions", JSON.stringify([newTx, ...existing]));
            router.push('/portfolio');
            router.refresh();
        }
    };

    return (
        <Card className="border-none shadow-none md:border md:shadow-sm overflow-hidden">
            <CardContent className="p-0 md:p-6">
                <form onSubmit={handleAddTransaction} className="space-y-8">

                    {/* 1. Transaction Type */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground ml-1">Transaction Type</label>
                        <Tabs
                            value={formData.type}
                            onValueChange={(val) => setFormData({ ...formData, type: val as 'buy' | 'sell' })}
                            className="w-full"
                        >
                            <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50 rounded-xl">
                                <TabsTrigger value="buy" className="h-full rounded-lg data-[state=active]:bg-background data-[state=active]:text-green-600 data-[state=active]:shadow-sm font-semibold">
                                    Buy
                                </TabsTrigger>
                                <TabsTrigger value="sell" className="h-full rounded-lg data-[state=active]:bg-background data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-semibold">
                                    Sell
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* 2. Metal Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground ml-1">Select Metal</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                className={`cursor-pointer relative overflow-hidden rounded-2xl border-2 p-4 flex flex-col items-center justify-center gap-3 transition-all duration-200 ${formData.metal === 'gold'
                                    ? 'border-yellow-500/50 bg-yellow-500/5 shadow-md'
                                    : 'border-muted hover:border-yellow-500/30 hover:bg-yellow-500/5'
                                    }`}
                                onClick={() => setFormData({ ...formData, metal: 'gold' })}
                            >
                                <div className={`text-3xl rounded-full p-3 ${formData.metal === 'gold' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-muted'}`}>
                                    🟡
                                </div>
                                <span className={`font-semibold ${formData.metal === 'gold' ? 'text-yellow-700 dark:text-yellow-400' : 'text-muted-foreground'}`}>Gold</span>
                            </div>

                            <div
                                className={`cursor-pointer relative overflow-hidden rounded-2xl border-2 p-4 flex flex-col items-center justify-center gap-3 transition-all duration-200 ${formData.metal === 'silver'
                                    ? 'border-slate-400/50 bg-slate-400/5 shadow-md'
                                    : 'border-muted hover:border-slate-400/30 hover:bg-slate-400/5'
                                    }`}
                                onClick={() => setFormData({ ...formData, metal: 'silver' })}
                            >
                                <div className={`text-3xl rounded-full p-3 ${formData.metal === 'silver' ? 'bg-slate-100 dark:bg-slate-800' : 'bg-muted'}`}>
                                    ⚪
                                </div>
                                <span className={`font-semibold ${formData.metal === 'silver' ? 'text-slate-700 dark:text-slate-400' : 'text-muted-foreground'}`}>Silver</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Details Inputs */}
                    <div className="space-y-6 bg-muted/20 p-5 rounded-2xl border border-muted/50">
                        {/* Quantity Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Quantity</label>
                                <Input
                                    type="number"
                                    min="0.00001"
                                    step="0.00001"
                                    className="h-11 bg-background"
                                    value={formData.quantity || ''}
                                    onChange={e => setFormData({ ...formData, quantity: e.target.value === '' ? '' as unknown as number : Number(e.target.value) })}
                                    placeholder="0.00000"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Unit</label>
                                <div className="grid grid-cols-2 p-1 bg-background border rounded-lg h-11 items-center">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, unit: 'tola' })}
                                        className={`h-9 rounded-md text-sm font-medium transition-colors ${formData.unit === 'tola' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                                    >
                                        Tola
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, unit: 'gram' })}
                                        className={`h-9 rounded-md text-sm font-medium transition-colors ${formData.unit === 'gram' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                                    >
                                        Gram
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Rate Row */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium">Rate per {formData.unit === 'tola' ? 'Tola' : 'Gram'} (NPR)</label>
                                {currentRates && (
                                    <button
                                        type="button"
                                        onClick={handleAutofillRate}
                                        className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full hover:bg-blue-100 transition-colors"
                                    >
                                        Auto-fill Market Rate
                                    </button>
                                )}
                            </div>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="h-11 bg-background font-mono"
                                value={formData.rate || ''}
                                onChange={e => setFormData({ ...formData, rate: e.target.value === '' ? '' as unknown as number : Number(e.target.value) })}
                                placeholder="0.00"
                            />
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date</label>
                            <Input
                                type="date"
                                className="h-11 bg-background"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Total Price & Action */}
                    <div className="pt-2">


                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 text-base font-semibold shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    <span>Saving...</span>
                                </div>
                            ) : (
                                "Save Transaction"
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full mt-3 text-muted-foreground hover:text-foreground"
                            onClick={() => router.push('/portfolio')}
                        >
                            Cancel
                        </Button>
                    </div>

                </form>
            </CardContent>
        </Card>
    );
}
