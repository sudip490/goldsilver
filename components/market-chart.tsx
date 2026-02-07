"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { CircleDollarSign, Droplets, Bitcoin, Banknote, LineChart, Gem, LayoutGrid, Square, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

// Dynamically import the widgets with no SSR to avoid hydration errors
const TradingViewWidget = dynamic(
    () => import("@/components/tradingview-widget").then((mod) => mod.default),
    {
        ssr: false,
        loading: () => <ChartSkeleton />,
    }
);

const GridWidget = dynamic(
    () => import("@/components/grid-widget").then((mod) => mod.default),
    {
        ssr: false,
        loading: () => <ChartSkeleton />,
    }
);

function ChartSkeleton() {
    return (
        <div className="w-full h-full flex items-center justify-center bg-muted/5 animate-pulse rounded-lg border">
            <LineChart className="h-8 w-8 text-muted-foreground/20 animate-bounce" />
        </div>
    );
}

export function MarketChart() {
    const [symbol, setSymbol] = useState("TVC:GOLD");
    const [viewMode, setViewMode] = useState<"single" | "grid">("single");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const isMobile = useMediaQuery("(max-width: 768px)");

    const markets = useMemo(() => [
        { id: "TVC:GOLD", label: "Gold", short: "Gold", icon: CircleDollarSign },
        { id: "TVC:SILVER", label: "Silver", short: "Silver", icon: Gem },
        { id: "FX_IDC:USDNPR", label: "USD/NPR", short: "USD", icon: Banknote },
        { id: "TVC:USOIL", label: "Crude Oil", short: "Oil", icon: Droplets },
        { id: "BITSTAMP:BTCUSD", label: "Bitcoin", short: "BTC", icon: Bitcoin },
    ], []);

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {viewMode === "single" && (
                    <Tabs defaultValue="TVC:GOLD" value={symbol} onValueChange={setSymbol} className="w-full sm:w-auto">
                        <TabsList className="grid grid-cols-5 w-full sm:w-auto h-auto p-1 bg-muted/50 backdrop-blur-sm border">
                            {markets.map((market) => (
                                <TabsTrigger
                                    key={market.id}
                                    value={market.id}
                                    className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2 text-xs sm:text-sm transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                                >
                                    <market.icon className="h-4 w-4 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">{market.label}</span>
                                    <span className="sm:hidden font-medium">{market.short}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                )}

                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border ml-auto w-full sm:w-auto justify-end">
                    {viewMode === "single" && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleFullscreen}
                            className="h-8 px-3 text-xs"
                            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            <span className="ml-2 hidden sm:inline">{isFullscreen ? "Exit" : "Expand"}</span>
                        </Button>
                    )}
                    <div className="w-px h-4 bg-border mx-1 hidden sm:block"></div>
                    <Button
                        variant={viewMode === "single" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => { setViewMode("single"); setIsFullscreen(false); }}
                        className="h-8 px-3 text-xs flex-1 sm:flex-none justify-center"
                    >
                        <Square className="h-4 w-4 mr-2" /> Single
                    </Button>
                    <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => { setViewMode("grid"); setIsFullscreen(false); }}
                        className="h-8 px-3 text-xs flex-1 sm:flex-none justify-center"
                    >
                        <LayoutGrid className="h-4 w-4 mr-2" /> Multi-View
                    </Button>
                </div>
            </div>

            {viewMode === "single" ? (
                <div className={cn(
                    "transition-all duration-300",
                    isFullscreen ? "fixed inset-0 z-50 bg-background p-4 flex flex-col" : "relative"
                )}>
                    {isFullscreen && (
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                {markets.find(m => m.id === symbol)?.icon && (() => {
                                    const Icon = markets.find(m => m.id === symbol)!.icon;
                                    return <Icon className="h-5 w-5" />;
                                })()}
                                {markets.find(m => m.id === symbol)?.label} Analysis
                            </h2>
                            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                                <Minimize2 className="h-4 w-4 mr-2" /> Exit Fullscreen
                            </Button>
                        </div>
                    )}

                    <Card className={cn(
                        "w-full overflow-hidden border shadow-sm transition-all duration-200 hover:border-primary/20 bg-card",
                        isFullscreen ? "flex-1 border-0 shadow-none" : "h-[60vh] md:h-[75vh] min-h-[400px] max-h-[800px]"
                    )}>
                        <TradingViewWidget key={symbol} symbol={symbol} hideSideToolbar={isMobile} />
                    </Card>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[120vh] md:h-[80vh]">
                    <div className="h-full min-h-[300px]">
                        <GridWidget symbol="TVC:GOLD" interval="D" />
                    </div>
                    <div className="h-full min-h-[300px]">
                        <GridWidget symbol="TVC:SILVER" interval="D" />
                    </div>
                    <div className="h-full min-h-[300px]">
                        <GridWidget symbol="FX_IDC:USDNPR" interval="D" />
                    </div>
                    <div className="h-full min-h-[300px]">
                        <GridWidget symbol="TVC:USOIL" interval="D" />
                    </div>
                </div>
            )}
        </div>
    );
}
