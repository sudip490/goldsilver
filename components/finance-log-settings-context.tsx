"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Currency = "NPR" | "INR" | "USD";

interface FinanceLogSettingsContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
}

const FinanceLogSettingsContext = createContext<FinanceLogSettingsContextType | undefined>(undefined);

export function FinanceLogSettingsProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrencyState] = useState<Currency>("NPR");

    useEffect(() => {
        const savedCurrency = localStorage.getItem("khata-currency");
        if (savedCurrency && ["NPR", "INR", "USD"].includes(savedCurrency)) {
            setCurrencyState(savedCurrency as Currency);
        }
    }, []);

    const setCurrency = (newCurrency: Currency) => {
        setCurrencyState(newCurrency);
        localStorage.setItem("khata-currency", newCurrency);
    };

    return (
        <FinanceLogSettingsContext.Provider value={{ currency, setCurrency }}>
            {children}
        </FinanceLogSettingsContext.Provider>
    );
}

export function useFinanceLogSettings() {
    const context = useContext(FinanceLogSettingsContext);
    if (context === undefined) {
        throw new Error("useFinanceLogSettings must be used within a FinanceLogSettingsProvider");
    }
    return context;
}
