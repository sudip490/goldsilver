// API Configuration
export const API_CONFIG = {
    // GoldPrice.org - Free, no API key required
    goldPrice: {
        baseUrl: "https://data-asg.goldprice.org/dbXRates",
        baseCurrency: "USD",
        free: true,
    },

    // Metals-API - Free tier: 100 requests/month
    metalsApi: {
        baseUrl: "https://api.metals.dev/v1",
        apiKey: process.env.NEXT_PUBLIC_METALS_API_KEY || "",
        free: true,
        rateLimit: "100/month",
    },

    // GoldAPI.io - Free tier: 100 requests/month
    goldApi: {
        baseUrl: "https://www.goldapi.io/api",
        apiKey: process.env.NEXT_PUBLIC_GOLD_API_KEY || "",
        free: true,
        rateLimit: "100/month",
    },

    // Exchange rates for currency conversion
    exchangeRate: {
        baseUrl: "https://api.exchangerate-api.com/v4/latest",
        free: true,
    },
};

// Nepal-specific sources (for scraping if needed)
// Currency conversion rates (approximate, should be fetched from API)
// Fallback static rates (updated Feb 2026)
// Used only if live exchange rate API fails
export const CURRENCY_TO_NPR = {
    USD: 144.47, // 1 USD = 144.47 NPR (Updated to match Xe.com/Local Market)
    INR: 91.52,  // 1 USD = 91.52 INR 
    GBP: 0.73,   // 1 USD = 0.73 GBP
    CNY: 6.95,   // 1 USD = 6.95 CNY 
    AED: 3.67,   // 1 USD = 3.67 AED
    EUR: 0.85,   // 1 USD = 0.85 EUR
};

// Units conversion
export const UNIT_CONVERSIONS = {
    GRAM_TO_TOLA: 11.6638,
    OZ_TO_GRAM: 31.1035,
    OZ_TO_TOLA: 2.6667,
};
