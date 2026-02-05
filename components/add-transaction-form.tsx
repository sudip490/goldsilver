"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PortfolioTransaction } from "@/lib/types";

interface AddTransactionFormProps {
    initialRates: { gold: number; silver: number; date: string };
}

export function AddTransactionForm({ initialRates }: AddTransactionFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState<Partial<PortfolioTransaction>>({
        type: 'buy',
        metal: 'gold',
        unit: 'tola',
        quantity: '' as any,
        rate: '' as any,
        date: new Date().toISOString().split('T')[0]
    });

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        const quantity = Number(formData.quantity) || 0;
        const ratePerTola = Number(formData.rate) || 0;
        const price = Number(formData.price) || 0;
        const unit = formData.unit as 'tola' | 'gram';

        // Validation: Must provide either rate or total price
        if (ratePerTola <= 0 && price <= 0) {
            return;
        }

        // Validation: Quantity must be positive
        if (quantity <= 0) {
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
            } else {
                alert('Failed to add transaction');
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
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Add Transaction</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAddTransaction} className="space-y-4">
                    {/* Create Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">Create</h3>
                            <div className="flex-1 h-px bg-border"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type</label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as 'buy' | 'sell' })}
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
                                    onChange={e => setFormData({ ...formData, metal: e.target.value as 'gold' | 'silver' })}
                                >
                                    <option value="gold">Gold</option>
                                    <option value="silver">Silver</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Details Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Quantity</label>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={formData.quantity || ''}
                                onChange={e => setFormData({ ...formData, quantity: e.target.value === '' ? '' as any : Number(e.target.value) })}
                                placeholder="Enter quantity"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Unit</label>
                            <select
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value as 'tola' | 'gram' })}
                            >
                                <option value="tola">Tola</option>
                                <option value="gram">Gram</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Rate per Tola (NPR) <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-muted-foreground">
                            Required if Total Price is empty. Always enter rate per Tola (auto-converts for Gram).
                        </p>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={formData.rate || ''}
                            onChange={e => setFormData({ ...formData, rate: e.target.value === '' ? '' as any : Number(e.target.value) })}
                            placeholder="e.g. 150000"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium">
                                Total Price (NPR) <span className="text-muted-foreground text-xs">(OR)</span>
                            </label>
                            <span className="text-xs text-muted-foreground">Auto-calculated if empty</span>
                        </div>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={formData.price || ''}
                            onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                            placeholder="Total Amount (if you know exact price)"
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

                    <div className="flex gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push('/portfolio')}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                            <Plus className="h-4 w-4" /> Add Transaction
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
