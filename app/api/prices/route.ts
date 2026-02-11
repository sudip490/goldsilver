import { NextResponse } from "next/server";
import { fetchAllMetalPrices, generateCountryData, fetchNRBRatesRaw, fetchGoldSilverNews } from "@/lib/api-service";
import fs from 'fs';
import path from 'path';

// Revalidate every 5 minutes (300 seconds) to get fresh news
export const revalidate = 60;

export async function GET() {
    try {
        const { prices, rates, nepalRates: asheshRates, goldHistory, silverHistory } = await fetchAllMetalPrices();
        const nrbRates = await fetchNRBRatesRaw();
        const countryData = generateCountryData(prices);
        const news = await fetchGoldSilverNews();

        // Trigger price change detection and email notifications (async, don't wait)
        if (asheshRates && asheshRates.length > 0) {
            triggerPriceChangeCheck(asheshRates).catch(() => {
                // Price check failed silently
            });
        }

        // Use the timestamp from the actual data (Nepal prices), not current time
        // This ensures the timestamp only updates when new data arrives
        const dataTimestamp = (asheshRates && asheshRates.length > 0 && asheshRates[0].date)
            ? new Date(asheshRates[0].date).toISOString()
            : (prices.length > 0 ? prices[0].lastUpdated : new Date().toISOString());

        return NextResponse.json({
            metalPrices: prices,
            countryData,
            rates,
            nrbRates,
            nepalRates: asheshRates,
            goldHistory,
            silverHistory,
            news,
            timestamp: dataTimestamp,
        });
    } catch {
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}

// Helper function to trigger price change check and email notifications
async function triggerPriceChangeCheck(nepalRates: Array<{ key: string; price: number }>) {
    try {
        const goldRate = nepalRates.find((r) => r.key === "fine-gold-tola")?.price || 0;
        const silverRate = nepalRates.find((r) => r.key === "silver-tola")?.price || 0;

        const priceHistoryPath = path.join(process.cwd(), 'data', 'last-price.json');
        let previousPrices = { gold: 0, silver: 0, lastUpdate: null as string | null };

        // Create data directory if it doesn't exist
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Read previous prices
        if (fs.existsSync(priceHistoryPath)) {
            try {
                const data = fs.readFileSync(priceHistoryPath, 'utf8');
                previousPrices = JSON.parse(data);
            } catch (err) {
                console.error('Failed to read previous prices:', err);
            }
        }

        // Check if prices have changed
        const goldChanged = previousPrices.gold !== goldRate && previousPrices.gold !== 0;
        const silverChanged = previousPrices.silver !== silverRate && previousPrices.silver !== 0;
        const pricesChanged = goldChanged || silverChanged;

        if (pricesChanged) {
            const goldChange = goldRate - previousPrices.gold;
            const silverChange = silverRate - previousPrices.silver;
            const goldChangePercent = previousPrices.gold > 0 ? (goldChange / previousPrices.gold) * 100 : 0;
            const silverChangePercent = previousPrices.silver > 0 ? (silverChange / previousPrices.silver) * 100 : 0;

            // Log price change for monitoring
            console.log(`📧 Price changed - Gold: ${goldChange > 0 ? '+' : ''}${goldChange} (${goldChangePercent.toFixed(2)}%), Silver: ${silverChange > 0 ? '+' : ''}${silverChange} (${silverChangePercent.toFixed(2)}%) - Sending notifications...`);

            // Trigger email sending (async)
            fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-price-update-all`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goldPrice: goldRate,
                    silverPrice: silverRate,
                    goldChange,
                    silverChange,
                    goldChangePercent,
                    silverChangePercent,
                }),
            }).then((response) => {
                if (response.ok) {
                    return response.json();
                } else {
                    console.error('Notification API failed:', response.status, response.statusText);
                }
            }).then((data) => {
                if (data) {
                    console.log(`✅ Notifications sent to ${data.successCount || 0} users`);
                }
            }).catch((err) => {
                console.error('Email sending failed:', err);
            });
        }

        // Always save current prices
        fs.writeFileSync(
            priceHistoryPath,
            JSON.stringify({
                gold: goldRate,
                silver: silverRate,
                lastUpdate: new Date().toISOString(),
            }, null, 2)
        );

    } catch (err) {
        console.error('Price trigger failed:', err);
    }
}
