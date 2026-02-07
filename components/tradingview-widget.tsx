"use client";

import { useEffect, useRef, memo } from "react";
import { useTheme } from "next-themes";

interface TradingViewWidgetProps {
    symbol?: string;
    hideSideToolbar?: boolean;
}

function TradingViewWidget({ symbol = "TVC:GOLD", hideSideToolbar = false }: TradingViewWidgetProps) {
    const container = useRef<HTMLDivElement>(null);
    const { theme, resolvedTheme } = useTheme();

    useEffect(() => {
        if (!container.current) return;

        // Clean up previous widget
        const widgetContainer = container.current.querySelector(".tradingview-widget-container__widget");
        if (widgetContainer) {
            widgetContainer.innerHTML = "";
        }

        // Remove existing script if any within the container (though we cleared innerHTML)
        const existingScript = container.current.querySelector("script");
        if (existingScript) existingScript.remove();

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;

        const currentTheme = (theme === "system" ? resolvedTheme : theme) === "dark" ? "dark" : "light";

        script.innerHTML = JSON.stringify({
            "autosize": true,
            "symbol": symbol,
            "interval": "D",
            "timezone": "Asia/Kathmandu",
            "theme": currentTheme,
            "style": "1",
            "locale": "en",
            "enable_publishing": false,
            "hide_side_toolbar": hideSideToolbar,
            "allow_symbol_change": true,
            "calendar": false,
            "support_host": "https://www.tradingview.com"
        });
        container.current.appendChild(script);
    }, [theme, resolvedTheme, symbol, hideSideToolbar]);

    return (
        <div className="tradingview-widget-container h-full w-full" ref={container}>
            <div className="tradingview-widget-container__widget h-full w-full"></div>
            <div className="tradingview-widget-copyright text-xs text-muted-foreground mt-2 hidden sm:block">
                <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank" className="hover:text-primary transition-colors">
                    Track all markets on TradingView
                </a>
            </div>
        </div>
    );
}

export default memo(TradingViewWidget);
