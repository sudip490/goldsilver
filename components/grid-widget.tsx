"use client";

import { useState, useEffect, useRef, memo } from "react";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";

interface TradingViewWidgetProps {
    symbol?: string;
    interval?: string;
    hideToolbar?: boolean;
}

function GridWidget({ symbol = "TVC:GOLD", interval = "D", hideToolbar = true }: TradingViewWidgetProps) {
    const container = useRef<HTMLDivElement>(null);
    const { theme, resolvedTheme } = useTheme();

    useEffect(() => {
        if (!container.current) return;

        // Clean up previous widget
        container.current.innerHTML = "";

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;

        const currentTheme = (theme === "system" ? resolvedTheme : theme) === "dark" ? "dark" : "light";

        script.innerHTML = JSON.stringify({
            "autosize": true,
            "symbol": symbol,
            "interval": interval,
            "timezone": "Asia/Kathmandu",
            "theme": currentTheme,
            "style": "1",
            "locale": "en",
            "enable_publishing": false,
            "allow_symbol_change": false, // Fixed symbol in grid
            "calendar": false,
            "hide_side_toolbar": hideToolbar,
            "hide_top_toolbar": hideToolbar,
            "support_host": "https://www.tradingview.com"
        });
        container.current.appendChild(script);
    }, [theme, resolvedTheme, symbol, interval, hideToolbar]);

    return (
        <div className="h-full w-full bg-card rounded-lg overflow-hidden border" ref={container} />
    );
}

export default memo(GridWidget);
