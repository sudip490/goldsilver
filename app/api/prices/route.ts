import { NextResponse } from "next/server";
import { fetchAllMetalPrices, generateCountryData, fetchNRBRatesRaw, fetchGoldSilverNews } from "@/lib/api-service";
import {
    saveDailyNepalRates,
    getLastRateBeforeToday,
    getLatestNotificationForToday,
    logNotification,
    hasTodayData
} from "@/lib/price-history-service";
import fs from 'fs';
import path from 'path';

// Revalidate every 60 seconds to get fresh news
export const revalidate = 60;

export async function GET() {
    try {
        const { prices, rates, nepalRates: asheshRates, goldHistory, silverHistory } = await fetchAllMetalPrices();
        const nrbRates = await fetchNRBRatesRaw();
        const countryData = generateCountryData(prices);
        const news = await fetchGoldSilverNews();

        // Save Nepal rates to database (async, don't wait)
        if (asheshRates && asheshRates.length > 0) {
            // Check if we already saved today's data to avoid duplicates
            // We use .then() to allow this to run in background without blocking response
            hasTodayData().then(async (exists) => {
                if (!exists) {
                    await saveDailyNepalRates(asheshRates);
                }
            }).catch(() => {
                // Failed to save, continue silently
            });

            // Trigger price change detection and email notifications (async, don't wait)
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
async function triggerPriceChangeCheck(nepalRates: Array<{ key: string; price: number; name: string; unit: string }>) {
    try {
        const goldRate = nepalRates.find((r) => r.key === "fine-gold-tola")?.price || 0;
        const silverRate = nepalRates.find((r) => r.key === "silver-tola")?.price || 0;

        // 1. Check if we already sent notification today
        const notifiedPrices = await getLatestNotificationForToday();
        if (notifiedPrices) {
            // If already notified, checks if price changed AGAIN (correction)
            // If price matches notified price, skip
            if (notifiedPrices.goldPrice === goldRate && notifiedPrices.silverPrice === silverRate) {
                return; // Already notified correct prices today
            }
            // If price changed significantly from notified price, we might re-notify
            // For now, let's just stick to "once per day or if price changes"
        }

        // 2. Get comparative price (YESTERDAY or earlier)
        // We explicitly avoid today's record because successful saveDailyNepalRates() might have just created it
        const prevGold = await getLastRateBeforeToday('Fine Gold', 'Tola');
        const prevSilver = await getLastRateBeforeToday('Silver', 'Tola');

        let previousPrices = { gold: 0, silver: 0, lastUpdate: null as string | null };

        // Use database prices if available
        if (prevGold && prevSilver) {
            previousPrices.gold = prevGold.price;
            previousPrices.silver = prevSilver.price;
            previousPrices.lastUpdate = prevGold.date.toISOString();
        } else {
            // Fallback to JSON file AND handle First Run case
            // If DB returns null (first run ever), check JSON
            const priceHistoryPath = path.join(process.cwd(), 'data', 'last-price.json');
            if (fs.existsSync(priceHistoryPath)) {
                try {
                    const data = fs.readFileSync(priceHistoryPath, 'utf8');
                    previousPrices = JSON.parse(data);
                } catch (err) {
                    console.error('Failed to read previous prices from JSON:', err);
                }
            }
            // If JSON is missing (e.g. prod data/ not committed), previousPrices remains 0
            // This prevents First Run Notification Spam (0 -> 150000)
        }

        // 3. Check if prices have changed
        // Explicitly ignore if previous price is 0 (First Run safety)
        const goldChanged = previousPrices.gold !== goldRate && previousPrices.gold !== 0;
        const silverChanged = previousPrices.silver !== silverRate && previousPrices.silver !== 0;
        const pricesChanged = goldChanged || silverChanged;

        if (pricesChanged) {
            const goldChange = goldRate - previousPrices.gold;
            const silverChange = silverRate - previousPrices.silver;
            const goldChangePercent = previousPrices.gold > 0 ? (goldChange / previousPrices.gold) * 100 : 0;
            const silverChangePercent = previousPrices.silver > 0 ? (silverChange / previousPrices.silver) * 100 : 0;

            // Log price change for monitoring
            console.log(`📧 Price changed to ${goldRate}/${silverRate} (Prev: ${previousPrices.gold}/${previousPrices.silver}) - Sending notifications...`);

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
            }).then(async (data) => {
                if (data) {
                    console.log(`✅ Notifications sent to ${data.successCount || 0} users`);

                    // Log notification to database to prevent duplicate sending
                    await logNotification({
                        goldPrice: goldRate,
                        silverPrice: silverRate,
                        goldChange,
                        silverChange,
                        goldChangePercent,
                        silverChangePercent,
                        usersNotified: data.successCount || 0,
                    });
                }
            }).catch((err) => {
                console.error('Email sending failed:', err);
            });
        }

        // Keep JSON file updated for backward compatibility (local dev only usually)
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            try { fs.mkdirSync(dataDir, { recursive: true }); } catch { }
        }

        const priceHistoryPath = path.join(dataDir, 'last-price.json');
        try {
            fs.writeFileSync(
                priceHistoryPath,
                JSON.stringify({
                    gold: goldRate,
                    silver: silverRate,
                    lastUpdate: new Date().toISOString(),
                }, null, 2)
            );
        } catch { }

    } catch (err) {
        console.error('Price trigger failed:', err);
    }
}
