"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Lock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Transaction {
    id: string;
    type: string;
    amount: number;
    date: Date;
    description: string;
    notes?: string;
}

interface PartyData {
    party: {
        name: string;
        type: string;
        balance: number;
    };
    transactions: Transaction[];
}

export default function SharedFinanceLogView() {
    const params = useParams();
    const token = params.token as string;
    const [data, setData] = useState<PartyData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const currency = "NPR"; // Default currency for shared view

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/finance-log/view/${token}`);

                if (!response.ok) {
                    const errorData = await response.json();
                    setError(errorData.error || "Failed to load data");
                    setIsLoading(false);
                    return;
                }

                const result = await response.json();
                setData(result);
            } catch {
                setError("Failed to load data. Please check your connection.");
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            fetchData();
        }
    }, [token]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading your statement...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                        <p className="text-muted-foreground mb-4">
                            {error || "This link is invalid or has expired."}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Please contact the sender for a new link.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { party, transactions } = data;
    const isReceivable = party.balance > 0;
    const isPayable = party.balance < 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8">
            <div className="container max-w-4xl px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Account Statement</h1>
                    <p className="text-muted-foreground">Read-only view</p>
                </div>

                {/* Party Info */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl">{party.name}</CardTitle>
                                <Badge variant="outline" className="mt-2 capitalize">
                                    {party.type}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Balance Card */}
                <Card className={`mb-6 ${isReceivable ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' : isPayable ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800' : ''}`}>
                    <CardContent className="pt-6 text-center">
                        <div className="text-sm font-medium mb-1">
                            Current Balance ({isReceivable ? "You'll Receive" : isPayable ? "You Need to Pay" : "Settled"})
                        </div>
                        <div className={`text-4xl font-bold ${isReceivable ? 'text-green-600 dark:text-green-400' : isPayable ? 'text-red-600 dark:text-red-400' : ''}`}>
                            {formatCurrency(Math.abs(party.balance), currency)}
                        </div>
                        {isPayable && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Please arrange payment at your earliest convenience
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Transaction History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {transactions.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No transactions recorded yet.
                            </div>
                        ) : (
                            <div>
                                {transactions.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-4 border-b last:border-0"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'gave'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {tx.type === 'gave' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                            </div>

                                            <div className="flex flex-col">
                                                <span className="font-semibold text-base text-foreground">
                                                    {tx.description}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {tx.notes && (
                                                    <span className="text-xs text-muted-foreground mt-1">
                                                        {tx.notes}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className={`font-bold text-lg whitespace-nowrap ${tx.type === 'gave' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {tx.type === 'gave' ? '+' : '-'} {formatCurrency(tx.amount, currency).replace(currency + ' ', '').replace('NPR ', '')}
                                            </div>
                                            <div className={`text-xs ${tx.type === 'gave' ? 'text-green-600/80' : 'text-red-600/80'}`}>
                                                {tx.type === 'gave' ? 'Paid' : 'Received'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center mt-8 text-sm text-muted-foreground">
                    <p>This is a read-only view. You cannot make changes to this statement.</p>
                    <p className="mt-2">If you have any questions, please contact the sender.</p>
                </div>
            </div>
        </div>
    );
}
