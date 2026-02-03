"use client";

import { useEffect, useState } from "react";
import { PriceCard } from "@/components/price-card";
import { CountryPriceTable } from "@/components/country-price-table";
import { PriceChart } from "@/components/price-chart";
import { NewsList } from "@/components/news-list";
import { SimpleExchangeRates } from "@/components/simple-exchange-rates";
import { NRBRatesTable } from "@/components/nrb-rates-table";
import { NRBRatesCards } from "@/components/nrb-rates-cards";
import { NepalMarketTable } from "@/components/nepal-market-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { MetalPrice, CountryData } from "@/lib/types";
import { generateMockHistory } from "@/lib/mock-data";
import { TrendingUp, Sparkles, Globe, Newspaper, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
    const [metalPrices, setMetalPrices] = useState<MetalPrice[]>([]);
    const [countryData, setCountryData] = useState<CountryData[]>([]);
    const [rates, setRates] = useState<Record<string, number>>({});
    const [nrbRates, setNrbRates] = useState<any[]>([]);
    const [nepalRates, setNepalRates] = useState<any[]>([]);
    const [historyData, setHistoryData] = useState<{ gold: any[]; silver: any[] }>({ gold: [], silver: [] });
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchPrices = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/prices");

            if (!response.ok) {
                throw new Error("Failed to fetch prices");
            }

            const data = await response.json();
            setMetalPrices(data.metalPrices || []);
            setCountryData(data.countryData || []);
            setRates(data.rates || {});
            setNrbRates(data.nrbRates || []);
            if (data.nepalRates) {
                setNepalRates(data.nepalRates);
            }
            if (data.goldHistory && data.silverHistory) {
                setHistoryData({
                    gold: data.goldHistory,
                    silver: data.silverHistory
                });
            }
            if (data.news) {
                setNews(data.news);
            }
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Error fetching prices:", err);
            setError("Failed to load real-time prices. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrices();

        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchPrices, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    // Get Nepal prices (featured)
    const nepalGold = metalPrices.find(
        (p) => p.country === "Nepal" && p.metal === "gold"
    );
    const nepalSilver = metalPrices.find(
        (p) => p.country === "Nepal" && p.metal === "silver"
    );

    // Get other country prices
    const otherPrices = metalPrices.filter((p) => p.country !== "Nepal");

    // Historical data
    const goldHistory = historyData.gold.length > 0
        ? historyData.gold
        : generateMockHistory(nepalGold?.price || 290000, 0.015);

    const silverHistory = historyData.silver.length > 0
        ? historyData.silver
        : generateMockHistory(nepalSilver?.price || 5300, 0.025);

    if (loading && metalPrices.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground">Loading real-time prices...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            {/* Header */}
            <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-gold-600 to-gold-800 bg-clip-text text-transparent">
                                    Gold & Silver Tracker
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Real-time precious metal prices
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-muted-foreground">Live Updates</span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchPrices}
                                disabled={loading}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                    {error && (
                        <div className="mt-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
                            {error}
                        </div>
                    )}
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Hero Section - Nepal Prices */}
                <section className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        <h2 className="text-3xl font-bold">Nepal Market</h2>
                        <span className="text-4xl ml-2">🇳🇵</span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        {nepalGold && <PriceCard data={nepalGold} featured />}
                        {nepalSilver && <PriceCard data={nepalSilver} featured />}
                    </div>

                    {/* Nepal Market Detailed Table */}
                    {nepalRates.length > 0 && (
                        <NepalMarketTable rates={nepalRates} />
                    )}


                    <div className="mt-6 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">Note:</span> 1 tola = 100 lal = 11.66 grams
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Daily updated on &gt; 11 am NPT
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                            Gold & silver rate updated on <span className="font-medium text-foreground">03 Feb 2026</span>
                        </div>
                    </div>
                </section>

                <Separator className="my-12" />

                {/* Price Charts */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Price Trends (30 Days)</h2>
                    <div className="grid lg:grid-cols-2 gap-6">
                        <PriceChart
                            data={goldHistory}
                            title="Gold Price History"
                            color="#eab308"
                            currency="NPR"
                        />
                        <PriceChart
                            data={silverHistory}
                            title="Silver Price History"
                            color="#64748b"
                            currency="NPR"
                        />
                    </div>
                </section>

                <Separator className="my-12" />

                {/* Global Prices */}
                <section className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                        <Globe className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-bold">Global Markets</h2>
                    </div>

                    <Tabs defaultValue="table" className="w-full">
                        <TabsList className="mb-6">
                            <TabsTrigger value="table">Table View</TabsTrigger>
                            <TabsTrigger value="cards">Card View</TabsTrigger>
                        </TabsList>

                        <TabsContent value="table">
                            <CountryPriceTable data={countryData} />
                        </TabsContent>

                        <TabsContent value="cards">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {otherPrices.map((price) => (
                                    <PriceCard key={price.id} data={price} />
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </section>

                <Separator className="my-12" />

                {/* Exchange Rates */}
                <section className="mb-12">
                    {nrbRates.length > 0 ? (
                        <NRBRatesCards rates={nrbRates} lastUpdated={lastUpdated.toISOString()} />
                    ) : (
                        <SimpleExchangeRates rates={rates} lastUpdated={lastUpdated.toISOString()} />
                    )}
                </section>

                <Separator className="my-12" />

                {/* News Section */}
                <section className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                        <Newspaper className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-bold">Market News</h2>
                    </div>
                    <NewsList news={news.length > 0 ? news : []} />
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t bg-card/50 backdrop-blur-sm mt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="font-semibold mb-3">About</h3>
                            <p className="text-sm text-muted-foreground">
                                Track real-time gold and silver prices across Nepal and global
                                markets. Get accurate, up-to-date pricing information for
                                informed investment decisions.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-3">Markets Covered</h3>
                            <ul className="text-sm text-muted-foreground space-y-1 grid grid-cols-2 gap-x-4">
                                <li>🇳🇵 Nepal</li>
                                <li>🇮🇳 India</li>
                                <li>🇺🇸 United States</li>
                                <li>🇬🇧 United Kingdom</li>
                                <li>🇨🇳 China</li>
                                <li>🇦🇪 UAE</li>
                                <li>🇯🇵 Japan</li>
                                <li>🇦🇺 Australia</li>
                                <li>🇨🇦 Canada</li>
                                <li>🇨🇭 Switzerland</li>
                                <li>🇸🇦 Saudi Arabia</li>
                                <li>🇹🇭 Thailand</li>
                                <li>🇸🇬 Singapore</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-3">Data Sources</h3>
                            <p className="text-sm text-muted-foreground">
                                Real-time data from GoldPrice.org API. Prices update every 5 minutes.
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                    <Separator className="my-6" />
                    <div className="text-center text-sm text-muted-foreground">
                        <p>
                            © {new Date().getFullYear()} Gold & Silver Tracker. All rights
                            reserved.
                        </p>
                        <p className="mt-2">
                            Disclaimer: Prices shown are for informational purposes only. Please verify
                            with local dealers before making any transactions.
                        </p>
                    </div>
                </div>
            </footer>
        </div >
    );
}
