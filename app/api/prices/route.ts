import { NextResponse } from "next/server";
import { fetchAllMetalPrices, generateCountryData, fetchNRBRatesRaw, fetchGoldSilverNews } from "@/lib/api-service";
import {
    saveDailyNepalRates,
    getLastRateBeforeToday,
    getNotificationForDate,
    logNotification,
    hasTodayData,
    getTodayNepalRates,
    deleteTodayNepalRates
} from "@/lib/price-history-service";
import fs from 'fs';
import path from 'path';

import { sendPriceNotificationsToAllUsers } from "@/lib/notification-service";

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
                } else {
                    // Check if the existing data matches the new data (handling corrections)
                    const currentDbRates = await getTodayNepalRates();
                    const needsUpdate = asheshRates.some(r => {
                        // Find matching rate in DB (by name and unit)
                        const match = currentDbRates.find(dbR => dbR.name === r.name && dbR.unit === r.unit);
                        // If not found or price mismatch, we need to update
                        return !match || match.price !== r.price;
                    });

                    if (needsUpdate) {
                        console.log('📝 Found discrepancies in today\'s rates - Updating database...');
                        await deleteTodayNepalRates();
                        await saveDailyNepalRates(asheshRates);
                    }
                }
            })
                .then(() => {
                    // Trigger price change detection and email notifications ONLY after DB is updated
                    return triggerPriceChangeCheck(asheshRates);
                })
                .catch((err) => {
                    console.error('Failed to save/update daily rates:', err);
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
async function triggerPriceChangeCheck(
    nepalRates: Array<{ key: string; price: number; name: string; unit: string; date: string }>
) {
    try {
        const goldRate = nepalRates.find((r) => r.key === "fine-gold-tola")?.price || 0;
        const silverRate = nepalRates.find((r) => r.key === "silver-tola")?.price || 0;
        const dataDateStr = nepalRates[0]?.date;

        // Ensure we have complete/valid data before proceeding
        if (!dataDateStr || goldRate <= 0 || silverRate <= 0) {
            console.log('Skipping notification: Incomplete data (Missing Date/Prices).');
            return;
        }

        const dataDate = new Date(dataDateStr);

        // 1. Check if we already sent notification FOR THIS SPECIFIC DATE
        const notifiedPrices = await getNotificationForDate(dataDate);

        // Logic:
        // - If NO notification for this date -> SEND (Daily Update)
        // - If YES notification, check for MISMATCH -> SEND (Correction)
        // - Else -> SKIP

        let shouldNotify = false;
        let notificationType = "Daily Update";

        if (!notifiedPrices) {
            shouldNotify = true;
            notificationType = "New Daily Data";
        } else {
            // Check for correction
            if (notifiedPrices.goldPrice !== goldRate || notifiedPrices.silverPrice !== silverRate) {
                shouldNotify = true;
                notificationType = "Price Correction";
                console.log(`⚠️ Price Correction: Previous(${notifiedPrices.goldPrice}) != New(${goldRate})`);
            } else {
                console.log(`✅ Already notified for date ${dataDateStr}. Skipping.`);
                return;
            }
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



        if (shouldNotify) {
            const goldChange = goldRate - previousPrices.gold;
            const silverChange = silverRate - previousPrices.silver;
            const goldChangePercent = previousPrices.gold > 0 ? (goldChange / previousPrices.gold) * 100 : 0;
            const silverChangePercent = previousPrices.silver > 0 ? (silverChange / previousPrices.silver) * 100 : 0;

            // Log trigger reason
            console.log(`📧 Triggering Notification [${notificationType}]. Current: ${goldRate}/${silverRate}, Prev: ${previousPrices.gold}/${previousPrices.silver}`);

            // Trigger email sending directly (no fetch loopback)
            sendPriceNotificationsToAllUsers({
                goldPrice: goldRate,
                silverPrice: silverRate,
                goldChange,
                silverChange,
                goldChangePercent,
                silverChangePercent,
            }).then(async (result) => {
                if (result.success) {
                    console.log(`✅ Notifications sent to ${result.successCount || 0} users`);

                    // Log notification to database to prevent duplicate sending
                    await logNotification({
                        goldPrice: goldRate,
                        silverPrice: silverRate,
                        goldChange,
                        silverChange,
                        goldChangePercent,
                        silverChangePercent,
                        usersNotified: result.successCount || 0,
                        date: dataDate,
                    });
                } else {
                    console.error('Notification service failed:', result.message);
                }
            }).catch((err) => {
                console.error('Email sending process failed:', err);
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
