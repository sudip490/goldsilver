"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Lock, AlertCircle, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Transaction {
    id: string;
    type: string;
    amount: number;
    date: Date;
    description: string;
    notes?: string;
}

interface Account {
    businessOwner: {
        name: string;
        email?: string;
        id?: string;
    };
    party: {
        id: string;
        name: string;
        type: string;
        balance: number;
        phone?: string;
    };
    transactions: Transaction[];
}

interface MyAccountsData {
    accounts: Account[];
}

export default function MyAccountPage() {
    const [data, setData] = useState<MyAccountsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const currency = "NPR";

    useEffect(() => {
        async function fetchMyAccounts() {
            try {
                const res = await fetch("/api/finance-log/my-account");

                if (!res.ok) {
                    const errorData = await res.json();
                    if (res.status === 401) {
                        router.push("/auth/login");
                        return;
                    }
                    throw new Error(errorData.message || "Failed to fetch accounts");
                }

                const accountsData = await res.json();
                setData(accountsData);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        }

        fetchMyAccounts();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading your accounts...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8">
                <div className="container max-w-2xl px-4">
                    <Card className="border-red-200 dark:border-red-800">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold mb-2">No Account Found</h2>
                                <p className="text-muted-foreground mb-4">
                                    {error || "Your email is not linked to any finance log."}
                                </p>
                                <Button onClick={() => router.push("/")}>Go Home</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const { accounts } = data;
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.party.balance, 0);
    const totalOwed = accounts.filter(acc => acc.party.balance < 0).reduce((sum, acc) => sum + Math.abs(acc.party.balance), 0);
    const totalReceivable = accounts.filter(acc => acc.party.balance > 0).reduce((sum, acc) => sum + acc.party.balance, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8">
            <div className="container max-w-6xl px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                        <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-4xl font-bold mb-2">My Accounts</h1>
                    <p className="text-muted-foreground flex items-center justify-center gap-2">
                        <Lock className="h-4 w-4" />
                        Read-only view
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground mb-1">Total Accounts</p>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{accounts.length}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border-red-200 dark:border-red-800">
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground mb-1">Total You Owe</p>
                            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalOwed, currency)}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200 dark:border-green-800">
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground mb-1">Total You'll Receive</p>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalReceivable, currency)}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Accounts List */}
                <div className="space-y-6">
                    {accounts.map((account, index) => {
                        const isReceivable = account.party.balance > 0;
                        const isPayable = account.party.balance < 0;

                        return (
                            <Card key={index} className="hover:shadow-lg transition-shadow">
                                <CardContent className="pt-6">
                                    {/* Business Owner Info */}
                                    <div className="flex items-center gap-4 mb-6 pb-4 border-b">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Business Owner</p>
                                            <h3 className="text-xl font-bold">{account.businessOwner.name}</h3>
                                            {account.businessOwner.email && (
                                                <a href={`mailto:${account.businessOwner.email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                                    {account.businessOwner.email}
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Balance & Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Balance */}
                                        <div className={`p-4 rounded-lg ${isReceivable ? 'bg-green-50 dark:bg-green-900/10' : isPayable ? 'bg-red-50 dark:bg-red-900/10' : 'bg-slate-50 dark:bg-slate-800'}`}>
                                            <p className="text-sm font-medium mb-1">
                                                {isReceivable ? "You'll Receive" : isPayable ? "You Need to Pay" : "Settled"}
                                            </p>
                                            <p className={`text-3xl font-bold ${isReceivable ? 'text-green-600 dark:text-green-400' : isPayable ? 'text-red-600 dark:text-red-400' : ''}`}>
                                                {formatCurrency(Math.abs(account.party.balance), currency)}
                                            </p>
                                        </div>

                                        {/* Account Info */}
                                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your Account</p>
                                            <p className="text-lg font-semibold">{account.party.name}</p>
                                            <Badge variant="outline" className="mt-1 capitalize">{account.party.type}</Badge>
                                        </div>
                                    </div>

                                    {/* Recent Transactions */}
                                    {account.transactions.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm font-medium mb-2">Recent Transactions ({account.transactions.length})</p>
                                            <div className="space-y-2">
                                                {account.transactions.slice(0, 3).map((tx) => (
                                                    <div key={tx.id} className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                                                        <div className="flex items-center gap-2">
                                                            {tx.type === 'got' ? (
                                                                <TrendingUp className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <TrendingDown className="h-4 w-4 text-red-500" />
                                                            )}
                                                            <div>
                                                                <p className="text-sm font-medium">{tx.description}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {new Date(tx.date).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <p className={`font-semibold ${tx.type === 'got' ? 'text-green-600' : 'text-red-600'}`}>
                                                            {tx.type === 'got' ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        💬 For payment arrangements or questions, contact the respective business owners above
                    </p>
                </div>
            </div>
        </div>
    );
}
