"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Send, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function SendEmailsPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        totalUsers?: number;
        successCount?: number;
        failCount?: number;
        priceOnlyCount?: number;
        results?: Array<{ email: string; status: string; messageId?: string; error?: unknown }>;
        error?: string;
        details?: string;
    } | null>(null);

    const handleSendEmails = async () => {
        if (!confirm("Are you sure you want to send price update emails to ALL users?")) {
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            // Fetch current prices from API
            const pricesResponse = await fetch('/api/prices');
            const pricesData = await pricesResponse.json();

            if (!pricesData.nepalRates || pricesData.nepalRates.length === 0) {
                throw new Error('Failed to fetch current prices');
            }

            // Extract gold and silver prices
            const goldRate = pricesData.nepalRates.find((r: { key: string; price: number }) => r.key === "fine-gold-tola")?.price || 0;
            const silverRate = pricesData.nepalRates.find((r: { key: string; price: number }) => r.key === "silver-tola")?.price || 0;

            // Read previous prices to calculate changes
            const historyResponse = await fetch('/data/last-price.json');
            let goldChange = 0;
            let silverChange = 0;

            if (historyResponse.ok) {
                const previousPrices = await historyResponse.json();
                goldChange = goldRate - (previousPrices.gold || 0);
                silverChange = silverRate - (previousPrices.silver || 0);
            }

            const goldChangePercent = goldRate > 0 && goldChange !== 0 ? (goldChange / (goldRate - goldChange)) * 100 : 0;
            const silverChangePercent = silverRate > 0 && silverChange !== 0 ? (silverChange / (silverRate - silverChange)) * 100 : 0;

            const response = await fetch('/api/send-price-update-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    goldPrice: goldRate,
                    silverPrice: silverRate,
                    goldChange,
                    silverChange,
                    goldChangePercent,
                    silverChangePercent,
                }),
            });

            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8">
            <div className="container max-w-4xl px-4">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">📧 Email Notification System</h1>
                    <p className="text-muted-foreground">Send price update emails to all registered users</p>
                </div>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Send Bulk Price Update
                        </CardTitle>
                        <CardDescription>
                            This will send personalized portfolio update emails to all users with active portfolios
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <h3 className="font-semibold mb-2">📬 Email Details:</h3>
                                <ul className="text-sm space-y-1 text-muted-foreground">
                                    <li>• <strong>From:</strong> goldsilvertracker.info@gmail.com</li>
                                    <li>• <strong>To:</strong> All registered users with portfolios</li>
                                    <li>• <strong>Content:</strong> Current gold/silver prices + personalized portfolio stats</li>
                                    <li>• <strong>Includes:</strong> Today&apos;s profit/loss compared to yesterday</li>
                                </ul>
                            </div>

                            <Button
                                onClick={handleSendEmails}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                size="lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Sending Emails...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-5 w-5" />
                                        Send Emails to All Users
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                {result && (
                    <Card className={result.success ? "border-green-200 dark:border-green-800" : "border-red-200 dark:border-red-800"}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {result.success ? (
                                    <>
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <span className="text-green-600">Email Send Complete</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-5 w-5 text-red-600" />
                                        <span className="text-red-600">Email Send Failed</span>
                                    </>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {result.success ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-blue-600">{result.totalUsers}</div>
                                            <div className="text-sm text-muted-foreground">Total Users</div>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-green-600">{result.successCount}</div>
                                            <div className="text-sm text-muted-foreground">Sent</div>
                                        </div>
                                        <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-red-600">{result.failCount}</div>
                                            <div className="text-sm text-muted-foreground">Failed</div>
                                        </div>
                                    </div>

                                    {result.results && result.results.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="font-semibold mb-2">Detailed Results:</h4>
                                            <div className="max-h-96 overflow-y-auto space-y-2">
                                                {result.results.map((r, i: number) => (
                                                    <div
                                                        key={i}
                                                        className={`p-3 rounded-lg flex items-center justify-between ${r.status === 'sent'
                                                            ? 'bg-green-50 dark:bg-green-950/30'
                                                            : 'bg-red-50 dark:bg-red-950/30'
                                                            }`}
                                                    >
                                                        <span className="text-sm">{r.email}</span>
                                                        <span className={`text-xs font-medium ${r.status === 'sent' ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {r.status}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-red-600">
                                    <p className="font-semibold">Error:</p>
                                    <p className="text-sm">{result.error || result.details}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
