"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface RefreshContextType {
    isRefreshing: boolean;
    refresh: () => Promise<void>;
    registerRefreshHandler: (handler: () => Promise<void>) => void;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export function RefreshProvider({ children }: { children: ReactNode }) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshHandler, setRefreshHandler] = useState<(() => Promise<void>) | null>(null);

    const registerRefreshHandler = useCallback((handler: () => Promise<void>) => {
        setRefreshHandler(() => handler);
    }, []);

    const refresh = useCallback(async () => {
        if (!refreshHandler) return;
        setIsRefreshing(true);
        try {
            await refreshHandler();
        } finally {
            setIsRefreshing(false);
        }
    }, [refreshHandler]);

    return (
        <RefreshContext.Provider value={{ isRefreshing, refresh, registerRefreshHandler }}>
            {children}
        </RefreshContext.Provider>
    );
}

export function useRefresh() {
    const context = useContext(RefreshContext);
    if (context === undefined) {
        throw new Error("useRefresh must be used within a RefreshProvider");
    }
    return context;
}
