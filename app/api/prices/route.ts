import { NextResponse } from "next/server";
import { fetchAllMetalPrices, generateCountryData, fetchNRBRatesRaw, fetchGoldSilverNews } from "@/lib/api-service";

// Revalidate every 5 minutes (300 seconds) to get fresh news
export const revalidate = 300;

export async function GET() {
    try {
        const { prices, rates, nepalRates: asheshRates, goldHistory, silverHistory } = await fetchAllMetalPrices();
        const nrbRates = await fetchNRBRatesRaw();
        const countryData = generateCountryData(prices);
        const news = await fetchGoldSilverNews();

        return NextResponse.json({
            metalPrices: prices,
            countryData,
            rates,
            nrbRates,
            nepalRates: asheshRates,
            goldHistory,
            silverHistory,
            news,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
