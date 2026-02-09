"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface FinanceLogTransactionFormProps {
    partyId?: string; // If null, user selects party
    onSuccess: () => void;
    onCancel: () => void;
}

export function FinanceLogTransactionForm({ partyId, onSuccess, onCancel }: FinanceLogTransactionFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        partyId: partyId || "",
        type: "gave", // Default to Gave (Debit - You gave money/goods)
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        notes: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch("/api/finance-log/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error("Failed to create transaction");

            setFormData({ partyId: partyId || "", type: "got", amount: "", date: new Date().toISOString().split("T")[0], description: "", notes: "" });
            onSuccess();
        } catch (error) {
            console.error(error);
            alert("Failed to record transaction");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rs</span>
                    <Input
                        id="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        className="pl-8 text-lg font-mono font-semibold"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                        <SelectTrigger className={formData.type === 'gave' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gave" className="text-green-600">Paid (Give Money/Goods)</SelectItem>
                            <SelectItem value="got" className="text-red-600">Received (Get Money)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                        id="date"
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Purpose / Description *</Label>
                <Input
                    id="description"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Monthly Rent, Invoice #123"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional details..."
                />
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    variant={formData.type === 'got' ? 'destructive' : 'default'}
                    className={formData.type === 'gave' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                    {isLoading ? "Saving..." : formData.type === 'gave' ? "Save (Paid - Given)" : "Save (Received - Got)"}
                </Button>
            </div>
        </form>
    );
}
