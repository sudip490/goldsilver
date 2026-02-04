import { DashboardClient } from "@/components/dashboard-client";
import { fetchAllMetalPrices, fetchNRBRatesRaw, generateCountryData, fetchGoldSilverNews } from "@/lib/api-service";

export const revalidate = 300; // Revalidate every 5 minutes

export default async function Home() {
    // Fetch all data in parallel
    const [
        metaPriceData,
        nrbRates,
        news
    ] = await Promise.all([
        fetchAllMetalPrices(),
        fetchNRBRatesRaw(),
        fetchGoldSilverNews()
    ]);

    const { prices, rates, nepalRates, goldHistory, silverHistory } = metaPriceData;
    const countryData = generateCountryData(prices);

    const initialData = {
        metalPrices: prices,
        countryData,
        rates,
        nrbRates,
        nepalRates, // These are Ashesh rates for table
        goldHistory,
        silverHistory,
        news,
        timestamp: new Date().toISOString(),
    };

    return <DashboardClient initialData={initialData} />;
}
