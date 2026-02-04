"use client";

import { useRefresh } from "@/contexts/refresh-context";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function GlobalRefreshButton() {
    const { refresh, isRefreshing } = useRefresh();

    return (
        <Button
            size="icon"
            className={cn(
                "fixed bottom-24 right-6 z-50 h-14 w-14 rounded-full shadow-lg md:hidden transition-all duration-300",
                // isRefreshing && "animate-spin" // Removed to prevent double spinning
            )}
            onClick={refresh}
            disabled={isRefreshing}
            aria-label="Refresh data"
        >
            <RefreshCw className={cn("h-6 w-6", isRefreshing && "animate-spin")} />
        </Button>
    );
}
