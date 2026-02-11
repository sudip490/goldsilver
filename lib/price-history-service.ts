import { db } from "@/db";
import { priceHistory, nepalRatesHistory, notificationLog } from "@/db/schema";
import { eq, and, gte, desc, lt } from "drizzle-orm";
import { NepalRate } from "./types";

// ... existing code ...

// Get latest Nepal rate strictly BEFORE today (Yesterday or earlier)
// This is crucial to avoid comparing against the record we just saved a millisecond ago
export async function getLastRateBeforeToday(
    name: string,
    unit: string
): Promise<{ price: number; date: Date } | null> {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const result = await db
            .select()
            .from(nepalRatesHistory)
            .where(
                and(
                    eq(nepalRatesHistory.name, name),
                    eq(nepalRatesHistory.unit, unit),
                    lt(nepalRatesHistory.date, today)
                )
            )
            .orderBy(desc(nepalRatesHistory.date))
            .limit(1);

        return result.length > 0
            ? { price: result[0].price, date: result[0].date }
            : null;
    } catch (error) {
        console.error('Failed to get last rate before today:', error);
        return null;
    }
}

// Get notification sent for today (to prevent duplicates)
export async function getLatestNotificationForToday(): Promise<{ goldPrice: number; silverPrice: number } | null> {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const result = await db
            .select()
            .from(notificationLog)
            .where(gte(notificationLog.date, today))
            .orderBy(desc(notificationLog.sentAt))
            .limit(1);

        if (result.length > 0) {
            return {
                goldPrice: result[0].goldPrice || 0,
                silverPrice: result[0].silverPrice || 0,
            };
        }
        return null;
    } catch (error) {
        console.error('Failed to check today notification:', error);
        return null;
    }
}


// Generate unique ID
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Save daily Nepal rates to database
export async function saveDailyNepalRates(rates: NepalRate[]) {
    try {
        const records = rates.map(rate => ({
            id: generateId(),
            date: new Date(rate.date),
            name: rate.name,
            unit: rate.unit,
            price: rate.price,
            change: rate.change || 0,
            changePercent: rate.changePercent || 0,
        }));

        await db.insert(nepalRatesHistory).values(records);
        console.log(`✅ Saved ${records.length} Nepal rates to database`);
        return true;
    } catch (error) {
        console.error('Failed to save Nepal rates:', error);
        return false;
    }
}

// Save price history record
export async function savePriceHistory(data: {
    date: Date;
    metalType: 'gold' | 'silver';
    priceType: string;
    price: number;
    change?: number;
    changePercent?: number;
    unit?: string;
    currency?: string;
}) {
    try {
        await db.insert(priceHistory).values({
            id: generateId(),
            ...data,
        });
        return true;
    } catch (error) {
        console.error('Failed to save price history:', error);
        return false;
    }
}

// Get previous day's price for a specific metal/type
export async function getPreviousDayPrice(
    metalType: 'gold' | 'silver',
    priceType: string
): Promise<number | null> {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const result = await db
            .select()
            .from(priceHistory)
            .where(
                and(
                    eq(priceHistory.metalType, metalType),
                    eq(priceHistory.priceType, priceType),
                    gte(priceHistory.date, yesterday)
                )
            )
            .orderBy(desc(priceHistory.date))
            .limit(1);

        return result.length > 0 ? result[0].price : null;
    } catch (error) {
        console.error('Failed to get previous day price:', error);
        return null;
    }
}

// Get previous Nepal rate for comparison
export async function getPreviousNepalRate(
    name: string,
    unit: string
): Promise<{ price: number; date: Date } | null> {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const result = await db
            .select()
            .from(nepalRatesHistory)
            .where(
                and(
                    eq(nepalRatesHistory.name, name),
                    eq(nepalRatesHistory.unit, unit),
                    gte(nepalRatesHistory.date, yesterday)
                )
            )
            .orderBy(desc(nepalRatesHistory.date))
            .limit(1);

        return result.length > 0
            ? { price: result[0].price, date: result[0].date }
            : null;
    } catch (error) {
        console.error('Failed to get previous Nepal rate:', error);
        return null;
    }
}

// Get latest Nepal rate from database
export async function getLatestNepalRate(
    name: string,
    unit: string
): Promise<{ price: number; date: Date; change: number | null } | null> {
    try {
        const result = await db
            .select()
            .from(nepalRatesHistory)
            .where(
                and(
                    eq(nepalRatesHistory.name, name),
                    eq(nepalRatesHistory.unit, unit)
                )
            )
            .orderBy(desc(nepalRatesHistory.date))
            .limit(1);

        return result.length > 0
            ? {
                price: result[0].price,
                date: result[0].date,
                change: result[0].change,
            }
            : null;
    } catch (error) {
        console.error('Failed to get latest Nepal rate:', error);
        return null;
    }
}

// Log notification sent
export async function logNotification(data: {
    goldPrice: number;
    silverPrice: number;
    goldChange: number;
    silverChange: number;
    goldChangePercent: number;
    silverChangePercent: number;
    usersNotified: number;
}) {
    try {
        await db.insert(notificationLog).values({
            id: generateId(),
            date: new Date(),
            ...data,
        });
        console.log(`✅ Logged notification for ${data.usersNotified} users`);
        return true;
    } catch (error) {
        console.error('Failed to log notification:', error);
        return false;
    }
}

// Get price history for a date range
export async function getPriceHistoryRange(
    metalType: 'gold' | 'silver',
    priceType: string,
    startDate: Date,
    endDate: Date
) {
    try {
        return await db
            .select()
            .from(priceHistory)
            .where(
                and(
                    eq(priceHistory.metalType, metalType),
                    eq(priceHistory.priceType, priceType),
                    gte(priceHistory.date, startDate)
                )
            )
            .orderBy(priceHistory.date);
    } catch (error) {
        console.error('Failed to get price history range:', error);
        return [];
    }
}

// Get latest price from database
export async function getLatestPrice(
    metalType: 'gold' | 'silver',
    priceType: string
): Promise<{ price: number; date: Date; change: number | null } | null> {
    try {
        const result = await db
            .select()
            .from(priceHistory)
            .where(
                and(
                    eq(priceHistory.metalType, metalType),
                    eq(priceHistory.priceType, priceType)
                )
            )
            .orderBy(desc(priceHistory.date))
            .limit(1);

        return result.length > 0
            ? {
                price: result[0].price,
                date: result[0].date,
                change: result[0].change,
            }
            : null;
    } catch (error) {
        console.error('Failed to get latest price:', error);
        return null;
    }
}

// Check if today's data already exists
export async function hasTodayData(): Promise<boolean> {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const result = await db
            .select()
            .from(nepalRatesHistory)
            .where(gte(nepalRatesHistory.date, today))
            .limit(1);

        return result.length > 0;
    } catch (error) {
        console.error('Failed to check today data:', error);
        return false;
    }
}
