import { MetalPrice, PriceHistory, CountryData, NewsItem } from "./types";

// Mock data removed as per user request
export const mockMetalPrices: MetalPrice[] = [];

// Generate mock historical data for the last 30 days
export const generateMockHistory = (
    basePrice: number,
    volatility: number = 0.02
): PriceHistory[] => {
    const history: PriceHistory[] = [];
    const now = new Date();

    for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        const randomChange = (Math.random() - 0.5) * 2 * volatility;
        const price = basePrice * (1 + randomChange);

        history.push({
            date: date.toISOString().split("T")[0],
            price: Math.round(price * 100) / 100,
        });
    }

    return history;
};

export const mockCountryData: CountryData[] = [];

export const mockNews: NewsItem[] = [
    {
        id: "1",
        title: "Gold Prices Surge in Nepal Amid Global Market Volatility",
        description:
            "Gold prices in Nepal have reached a new high of NPR 145,000 per tola as global markets experience increased volatility. Experts predict continued upward trends.",
        source: "Nepal Economic Times",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        url: "#",
    },
    {
        id: "2",
        title: "Central Bank Announces New Regulations for Precious Metal Trading",
        description:
            "Nepal Rastra Bank has introduced new guidelines for gold and silver trading to ensure market transparency and protect consumer interests.",
        source: "The Himalayan Times",
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        url: "#",
    },
    {
        id: "3",
        title: "Silver Demand Increases in Industrial Sector",
        description:
            "Industrial demand for silver has seen a significant uptick, particularly in the electronics and solar panel manufacturing sectors.",
        source: "Metal Market Weekly",
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        url: "#",
    },
    {
        id: "4",
        title: "Global Gold Reserves Hit Record Levels",
        description:
            "Central banks worldwide have increased their gold reserves to unprecedented levels, signaling confidence in the precious metal as a safe haven asset.",
        source: "International Finance Review",
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        url: "#",
    },
    {
        id: "5",
        title: "Nepal's Gold Imports Show Steady Growth in Q1",
        description:
            "Official data reveals that Nepal's gold imports have grown by 15% in the first quarter, driven by strong consumer demand and wedding season.",
        source: "Business Standard Nepal",
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        url: "#",
    },
];
