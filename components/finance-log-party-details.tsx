"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Download, Phone, Trash2, TrendingUp, TrendingDown, Share2 } from "lucide-react";
import { FinanceLogParty, FinanceLogTransaction } from "@/lib/types";
import { FinanceLogTransactionForm } from "./finance-log-transaction-form";
import { formatCurrency } from "@/lib/utils";
import { useFinanceLogSettings } from "./finance-log-settings-context";
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
import { useMediaQuery } from "@/hooks/use-media-query";

function TransactionDetailsList({ transaction, currency }: { transaction: FinanceLogTransaction, currency: string }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${transaction.type === 'gave' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {transaction.type === 'gave' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                </div>
                <div>
                    <div className="text-sm text-muted-foreground">Transaction Type</div>
                    <div className="font-semibold capitalize text-lg">
                        {transaction.type === 'gave' ? 'Paid (Given)' : 'Received (Got)'}
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground">Amount</div>
                <div className={`text-2xl font-bold ${transaction.type === 'gave' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'gave' ? '+' : '-'} {formatCurrency(transaction.amount, currency)}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-4 border-t">
                <div>
                    <div className="text-sm text-muted-foreground">Description</div>
                    <div className="font-medium">{transaction.description}</div>
                </div>
                <div>
                    <div className="text-sm text-muted-foreground">Date</div>
                    <div className="font-medium">{new Date(transaction.date).toLocaleDateString()} • {new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            </div>

            {transaction.notes && (
                <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground">Notes</div>
                    <div className="font-medium">{transaction.notes}</div>
                </div>
            )}
        </div>
    )
}

export function FinanceLogPartyDetails() {
    const params = useParams();
    const router = useRouter();
    const partyId = params.id as string;
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const { currency } = useFinanceLogSettings();

    const [party, setParty] = useState<FinanceLogParty | null>(null);
    const [transactions, setTransactions] = useState<FinanceLogTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddTransaction, setShowAddTransaction] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<FinanceLogTransaction | null>(null);
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);

    const fetchData = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            // Fetch specific party details directly from the API
            const partyRes = await fetch(`/api/finance-log/parties/${partyId}`);

            if (partyRes.ok) {
                const partyData = await partyRes.json();
                setParty(partyData);
            } else {
                // Party not found
                // Optionally handle redirect or error state here
            }

            const txRes = await fetch(`/api/finance-log/transactions?partyId=${partyId}`);
            if (txRes.ok) {
                const txData = await txRes.json();
                setTransactions(txData);
            }
        } catch {
            // Error fetching details
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [partyId]);

    const handleDeleteTransaction = async (txId: string) => {
        if (!confirm("Are you sure you want to delete this transaction?")) return;

        const previousTransactions = [...transactions];
        const previousParty = party ? { ...party } : null;
        const txToDelete = transactions.find(t => t.id === txId);

        if (!txToDelete) return;

        // Optimistic UI Update
        try {
            // 1. Remove transaction from list immediately
            setTransactions(prev => prev.filter(t => t.id !== txId));

            // 2. Update balance immediately
            if (party) {
                let newBalance = party.balance || 0;
                if (txToDelete.type === 'gave') {
                    newBalance -= txToDelete.amount;
                } else {
                    newBalance += txToDelete.amount;
                }
                setParty({ ...party, balance: newBalance });
            }

            // 3. Close the drawer/sheet immediately
            setSelectedTransaction(null);

            // 4. Perform API call in background
            const res = await fetch(`/api/finance-log/transactions/${txId}`, { method: 'DELETE' });

            if (!res.ok) {
                throw new Error("Failed to delete backend");
            }

            // Optional: Silent revalidate to ensure data consistency
            fetchData(false);

        } catch {
            alert("Failed to delete transaction. Restoring...");
            // Rollback on error
            setTransactions(previousTransactions);
            if (previousParty) setParty(previousParty);
        }
    };

    useEffect(() => {
        if (partyId) {
            fetchData();
        }
    }, [partyId, fetchData]);

    const handleDeleteParty = async () => {
        if (!confirm("Are you sure? This will delete the contact and ALL transaction history!")) return;

        try {
            const res = await fetch(`/api/finance-log/parties/${partyId}`, { method: 'DELETE' });
            if (res.ok) {
                router.push("/finance-log");
            } else {
                alert("Failed to delete contact");
            }
        } catch {
            alert("An error occurred while deleting");
        }
    };


    const handleGenerateShareLink = async () => {
        if (!party) return; // Guard against null party

        // If party has email, ask if they want to send via email
        if (party.email) {
            const sendViaEmail = confirm(
                `Send statement to ${party.email}?\n\n` +
                `✓ YES - Send link via email to ${party.name}\n` +
                `✗ NO - Just copy link to clipboard\n\n` +
                `The customer will receive a link to view their account statement.`
            );

            setIsGeneratingLink(true);
            try {
                const res = await fetch('/api/finance-log/share', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        partyId,
                        sendEmail: sendViaEmail
                    }),
                });

                if (res.ok) {
                    const data = await res.json();

                    // Copy to clipboard
                    await navigator.clipboard.writeText(data.shareUrl);

                    if (sendViaEmail) {
                        alert(
                            `✅ Email sent to ${party.email}!\n\n` +
                            `The link has also been copied to your clipboard.\n\n` +
                            `Share link:\n${data.shareUrl}`
                        );
                    } else {
                        alert(
                            `✅ Share link copied to clipboard!\n\n` +
                            `You can now send this link via WhatsApp, SMS, or any messaging app.\n\n` +
                            `Share link:\n${data.shareUrl}`
                        );
                    }
                } else {
                    const errorData = await res.json();
                    alert(`Failed to generate share link\n\n${errorData.details || errorData.error || ''}`);
                }
            } catch (error) {
                alert('An error occurred while generating share link');
                console.error('Share link error:', error);
            } finally {
                setIsGeneratingLink(false);
            }
        } else {
            // No email - just generate and copy link
            setIsGeneratingLink(true);
            try {
                const res = await fetch('/api/finance-log/share', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ partyId }),
                });

                if (res.ok) {
                    const data = await res.json();

                    // Copy to clipboard
                    await navigator.clipboard.writeText(data.shareUrl);
                    alert(
                        `✅ Share link copied to clipboard!\n\n` +
                        `You can now send this link via WhatsApp, SMS, or any messaging app.\n\n` +
                        `💡 Tip: Add an email address to this contact to send statements automatically!\n\n` +
                        `Share link:\n${data.shareUrl}`
                    );
                } else {
                    const errorData = await res.json();
                    alert(`Failed to generate share link\n\n${errorData.details || errorData.error || ''}`);
                }
            } catch (error) {
                alert('An error occurred while generating share link');
                console.error('Share link error:', error);
            } finally {
                setIsGeneratingLink(false);
            }
        }
    };


    if (isLoading) return <div className="p-8 text-center">Loading...</div>;
    if (!party) return <div className="p-8 text-center">Contact not found</div>;

    const balance = party.balance || 0;
    const isReceivable = balance > 0;
    const isPayable = balance < 0;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push("/finance-log")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {party.name}
                        <Badge variant="outline" className="capitalize text-sm font-normal">
                            {party.type}
                        </Badge>
                    </h1>
                    {party.phone && (
                        <div className="text-muted-foreground flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" /> {party.phone}
                        </div>
                    )}
                </div>
                <div className="ml-auto flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleGenerateShareLink}
                        disabled={isGeneratingLink}
                        title="Share Statement"
                    >
                        <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={handleDeleteParty} title="Delete Contact">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Balance Card */}
            <Card className={`${isReceivable ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' : isPayable ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800' : ''}`}>
                <CardContent className="pt-6 text-center">
                    <div className="text-sm font-medium mb-1">
                        Current Balance ({isReceivable ? "To Receive" : isPayable ? "To Pay" : "Settled"})
                    </div>
                    <div className={`text-4xl font-bold ${isReceivable ? 'text-green-600 dark:text-green-400' : isPayable ? 'text-red-600 dark:text-red-400' : ''}`}>
                        {formatCurrency(Math.abs(balance), currency)}
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2">
                <Button className="flex-1 gap-2" ref={(el) => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} onClick={() => setShowAddTransaction(true)}>
                    <Plus className="h-4 w-4" /> Add Transaction
                </Button>
                <Button variant="outline" className="flex-1 gap-2" disabled>
                    <Download className="h-4 w-4" /> PDF Report
                </Button>
            </div>

            {/* Add Transaction Form */}
            {showAddTransaction && (
                <Card className="border-2 border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-lg">New Transaction</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FinanceLogTransactionForm
                            partyId={party.id}
                            onSuccess={() => {
                                setShowAddTransaction(false);
                                fetchData();
                            }}
                            onCancel={() => setShowAddTransaction(false)}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Transaction History (Portfolio Style) */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Transaction History</h3>
                <Card>
                    <CardContent className="pt-6 p-0">
                        {transactions.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No transactions recorded yet.
                            </div>
                        ) : (
                            <div>
                                {transactions.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                                        onClick={() => setSelectedTransaction(tx)}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Icon Avatar */}
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'gave'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {tx.type === 'gave' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                            </div>

                                            {/* Description & Date */}
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-base text-foreground">
                                                    {tx.description}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Amount & Type */}
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
            </div>

            {/* Transaction Details Sheet (Desktop) / Drawer (Mobile) */}
            {isDesktop !== undefined && (
                isDesktop ? (
                    <Sheet open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
                        <SheetContent side="right">
                            <SheetHeader>
                                <SheetTitle>Transaction Details</SheetTitle>
                                <SheetDescription>View transaction information</SheetDescription>
                            </SheetHeader>
                            {selectedTransaction && (
                                <div className="py-6 flex flex-col h-full">
                                    <div className="flex-1">
                                        <TransactionDetailsList transaction={selectedTransaction} currency={currency} />
                                    </div>
                                    <div className="pt-6 border-t mt-auto">
                                        <Button
                                            variant="destructive"
                                            className="w-full"
                                            onClick={() => handleDeleteTransaction(selectedTransaction.id)}
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
                                        <TransactionDetailsList transaction={selectedTransaction} currency={currency} />
                                    </div>
                                )}
                                <DrawerFooter className="gap-2">
                                    {selectedTransaction && (
                                        <Button
                                            variant="destructive"
                                            className="w-full"
                                            onClick={() => handleDeleteTransaction(selectedTransaction.id)}
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
                )
            )}
        </div>
    );
}
