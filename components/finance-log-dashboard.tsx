"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "./ui/badge";
import { ArrowUpRight, ArrowDownLeft, Search, UserPlus, User } from "lucide-react";
import { FinanceLogParty, FinanceLogBalance } from "@/lib/types";
import { FinanceLogPartyForm } from "./finance-log-party-form";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { FinanceLogSettingsProvider, useFinanceLogSettings } from "./finance-log-settings-context";
import { CurrencySelector } from "./currency-selector";

export function FinanceLogDashboard() {
    return (
        <FinanceLogSettingsProvider>
            <FinanceLogDashboardContent />
        </FinanceLogSettingsProvider>
    );
}

function FinanceLogDashboardContent() {
    const { currency } = useFinanceLogSettings();
    const [parties, setParties] = useState<FinanceLogParty[]>([]);
    const [summary, setSummary] = useState<FinanceLogBalance>({ totalReceivable: 0, totalPayable: 0, netBalance: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddParty, setShowAddParty] = useState(false);
    const [filterType, setFilterType] = useState<string>("all");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [partiesRes, summaryRes] = await Promise.all([
                fetch("/api/finance-log/parties"),
                fetch("/api/finance-log/dashboard")
            ]);

            if (partiesRes.ok && summaryRes.ok) {
                const partiesData = await partiesRes.json();
                const summaryData = await summaryRes.json();
                setParties(partiesData);
                setSummary(summaryData);
            }
        } catch {
            // Error fetching data
        } finally {
            setIsLoading(false);
        }
    };

    const filteredParties = parties.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.phone?.includes(searchTerm);
        const matchesType = filterType === "all" || p.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Finance Log</h1>
                    <p className="text-muted-foreground">Manage your debts and credits</p>
                </div>
                <div className="flex gap-2">
                    <CurrencySelector />
                    <Link href="/finance-log/my-account">
                        <Button variant="outline">
                            <User className="h-4 w-4 mr-2" />
                            My Account
                        </Button>
                    </Link>
                    <Button onClick={() => setShowAddParty(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Contact
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                            To Receive (Get)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-400 flex items-center">
                            <ArrowDownLeft className="h-5 w-5 mr-2" />
                            {formatCurrency(summary.totalReceivable, currency)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
                            To Pay (Give)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700 dark:text-red-400 flex items-center">
                            <ArrowUpRight className="h-5 w-5 mr-2" />
                            {formatCurrency(summary.totalPayable, currency)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold flex items-center ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(summary.netBalance, currency)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by name or phone..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                    {['all', 'customer', 'supplier', 'personal'].map(type => (
                        <Button
                            key={type}
                            variant={filterType === type ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterType(type)}
                            className="capitalize"
                        >
                            {type}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Parties List */}
            {isLoading ? (
                <div className="text-center py-10">Loading...</div>
            ) : filteredParties.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="bg-muted p-3 rounded-full mb-4">
                            <UserPlus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg mb-1">No contacts found</h3>
                        <p className="text-muted-foreground mb-4 max-w-sm">
                            Add people to your Finance Log to start tracking transactions.
                        </p>
                        <Button onClick={() => setShowAddParty(true)}>Add Your First Contact</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredParties.map(party => (
                        <Link href={`/finance-log/${party.id}`} key={party.id}>
                            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold
                                            ${(party.balance || 0) > 0 ? 'bg-green-600' : (party.balance || 0) < 0 ? 'bg-red-600' : 'bg-gray-400'}`}>
                                            {party.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-semibold">{party.name}</div>
                                            <div className="text-xs text-muted-foreground flex gap-2 items-center">
                                                <Badge variant="outline" className="capitalize text-[10px] h-5 px-1">{party.type}</Badge>
                                                {party.phone && <span>{party.phone}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className={`font-bold ${(party.balance || 0) > 0 ? 'text-green-600' : (party.balance || 0) < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                            {formatCurrency(Math.abs(party.balance || 0), currency)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {(party.balance || 0) > 0 ? "To Receive" : (party.balance || 0) < 0 ? "To Pay" : "Settled"}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {/* Add Party Modal/Form */}
            {showAddParty && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Add New Contact</CardTitle>
                            <CardDescription>Add a person or business to your Finance Log</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FinanceLogPartyForm
                                onSuccess={() => {
                                    setShowAddParty(false);
                                    fetchData();
                                }}
                                onCancel={() => setShowAddParty(false)}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
