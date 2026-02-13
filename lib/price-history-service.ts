import { db } from "@/db";
import { priceHistory, nepalRatesHistory, notificationLog } from "@/db/schema";
import { eq, and, gte, desc, lt, lte } from "drizzle-orm";
import { NepalRate } from "./types";

// Get latest Nepal rate strictly BEFORE today (Yesterday or earlier)
// This is crucial to avoid comparing against the record we just saved a millisecond ago
export async function getLastRateBeforeToday(
    name: string,
    unit: string
): Promise<{ price: number; date: Date } | null> {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;
        // Create UTC midnight date matching local YYYY-MM-DD
        const today = new Date(localDateStr);

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

// Get notification sent for a specific date (Data Date)
export async function getNotificationForDate(date: Date): Promise<{ goldPrice: number; silverPrice: number } | null> {
    try {
        // Create start and end of the given date to ensure we match regardless of time component
        // OR if we trust the date is exactly stored as midnight, we can use eq()
        // But to be safe, let's match the YYYY-MM-DD part
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const searchDate = new Date(`${year}-${month}-${day}`); // Midnight Local

        // We assume the date in DB is also stored normalized or we check range
        // For simplicity and matching 'saveDailyNepalRates', let's match the exact date if possible
        // But 'saveDailyNepalRates' stores 'new Date(rate.date)'. 

        // Let's search for any notification where the stored date matches this day
        const nextDay = new Date(searchDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const result = await db
            .select()
            .from(notificationLog)
            .where(
                and(
                    gte(notificationLog.date, searchDate),
                    lt(notificationLog.date, nextDay)
                )
            )
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
        console.error('Failed to check notification for date:', error);
        return null;
    }
}

// Get notification sent for today (to prevent duplicates) - DEPRECATED in favor of getNotificationForDate
export async function getLatestNotificationForToday(): Promise<{ goldPrice: number; silverPrice: number } | null> {
    return getNotificationForDate(new Date());
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
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const year = yesterday.getFullYear();
        const month = String(yesterday.getMonth() + 1).padStart(2, '0');
        const day = String(yesterday.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;
        const yesterdayDate = new Date(localDateStr);

        const result = await db
            .select()
            .from(priceHistory)
            .where(
                and(
                    eq(priceHistory.metalType, metalType),
                    eq(priceHistory.priceType, priceType),
                    gte(priceHistory.date, yesterdayDate)
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
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const year = yesterday.getFullYear();
        const month = String(yesterday.getMonth() + 1).padStart(2, '0');
        const day = String(yesterday.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;
        const yesterdayDate = new Date(localDateStr);

        const result = await db
            .select()
            .from(nepalRatesHistory)
            .where(
                and(
                    eq(nepalRatesHistory.name, name),
                    eq(nepalRatesHistory.unit, unit),
                    gte(nepalRatesHistory.date, yesterdayDate)
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
    date?: Date;
}) {
    try {
        await db.insert(notificationLog).values({
            id: generateId(),
            date: data.date || new Date(),
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
                    gte(priceHistory.date, startDate),
                    lte(priceHistory.date, endDate)
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
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;
        const today = new Date(localDateStr);

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

// Get all Nepal rates for today
export async function getTodayNepalRates(): Promise<{ name: string, unit: string, price: number }[]> {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;
        const today = new Date(localDateStr);

        const result = await db
            .select({
                name: nepalRatesHistory.name,
                unit: nepalRatesHistory.unit,
                price: nepalRatesHistory.price
            })
            .from(nepalRatesHistory)
            .where(gte(nepalRatesHistory.date, today));

        return result;
    } catch (error) {
        console.error('Failed to get today rates:', error);
        return [];
    }
}

// Delete all Nepal rates for today (to allow re-saving correct data)
export async function deleteTodayNepalRates(): Promise<boolean> {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;
        const today = new Date(localDateStr);

        await db
            .delete(nepalRatesHistory)
            .where(gte(nepalRatesHistory.date, today));

        console.log('🗑️ Deleted existing Nepal rates for today');
        return true;
    } catch (error) {
        console.error('Failed to delete today rates:', error);
        return false;
    }
}
