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
