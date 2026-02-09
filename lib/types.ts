export interface MetalPrice {
    id: string;
    metal: "gold" | "silver";
    country: string;
    countryCode: string;
    price: number;
    currency: string;
    unit: string;
    change: number;
    changePercent: number;
    lastUpdated: string;
    high24h: number;
    low24h: number;
}

export interface PriceHistory {
    date: string;
    price: number;
}

export interface CountryData {
    country: string;
    countryCode: string;
    currency: string;
    goldPrice: number;
    goldUnit: string;
    silverPrice: number;
    silverUnit: string;
    goldChange: number;
    goldChangeValue: number;
    silverChange: number;
    silverChangeValue: number;
    lastUpdated: string;
}

export interface NewsItem {
    id: string;
    title: string;
    description: string;
    source: string;
    publishedAt: string;
    url: string;
    imageUrl?: string;
    category?: string;
    summary?: string;
}

export interface PortfolioTransaction {
    id: string;
    type: 'buy' | 'sell';
    metal: 'gold' | 'silver';
    unit: 'tola' | 'gram';
    quantity: number;
    price: number; // Total price paid/received
    rate: number; // Rate per unit at that time
    date: string;
    notes?: string;
}

export interface NepalRate {
    key: string;
    name: string;
    unit: string;
    price: number;
    change?: number;
    changePercent?: number;
    date: string;
}

export interface NRBRate {
    currency: {
        iso3: string;
        name: string;
        unit: number;
    };
    buy: string | number;
    sell: string | number;
}

export interface NRBRawRate {
    currency: {
        iso3: string;
        name: string;
        unit: number;
    };
    buy: string;
    sell: string;
}

export interface GoldPriceOrgData {
    items: Array<{
        curr: string;
        xauPrice: number;
        xagPrice: number;
        chgXau: number;
        chgXag: number;
        pcXau: number;
        pcXag: number;
        xauClose: number;
        xagClose: number;
        [key: string]: unknown;
    }>;
}

// Finance Log Types
export type PartyType = 'customer' | 'supplier' | 'staff' | 'personal';
export type TransactionType = 'gave' | 'got';

export interface FinanceLogParty {
    id: string;
    userId: string;
    name: string;
    phone?: string;
    email?: string;
    type: PartyType;
    notes?: string;
    balance?: number; // Calculated field: positive = they owe you, negative = you owe them
    createdAt: Date;
    updatedAt: Date;
}

export interface FinanceLogTransaction {
    id: string;
    userId: string;
    partyId: string;
    type: TransactionType;
    amount: number;
    date: Date;
    description: string;
    notes?: string;
    attachmentUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    partyName?: string; // For display purposes
}

export interface FinanceLogBalance {
    totalReceivable: number; // Total "You'll Get" (positive balances)
    totalPayable: number;    // Total "You'll Give" (negative balances)
    netBalance: number;      // Receivable - Payable
}

export interface Budget {
    id: string;
    userId: string;
    name: string;
    amount: number;
    period: 'monthly' | 'yearly' | 'custom';
    categoryId?: string;
    startDate: Date;
    endDate?: Date;
    isActive: boolean;
    alertThreshold: number;
    totalSpent?: number; // Calculated field
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Category {
    id: string;
    userId: string;
    name: string;
    icon: string;
    color?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
