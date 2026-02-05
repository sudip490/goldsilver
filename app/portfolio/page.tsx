import { PortfolioClient } from "@/components/portfolio-client";
import { ProtectedRoute } from "@/components/protected-route";
import { fetchAllMetalPrices } from "@/lib/api-service";
import { NepalRate, PortfolioTransaction } from "@/lib/types";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { portfolioTransaction } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const revalidate = 0; // Dynamic, no caching for user portfolio

export default async function PortfolioPage() {
    // 1. Get Session & User
    const headerList = await headers();
    const session = await auth.api.getSession({
        headers: headerList,
    });

    if (!session?.user?.id) {
        // ProtectedRoute will handle redirect, but we can't fetch data without user
        // Just return default state and let ProtectedRoute redirect
    }

    // 2. Fetch Data in Parallel
    const [pricesData, transactionsData] = await Promise.all([
        fetchAllMetalPrices(),
        session?.user?.id
            ? db.select().from(portfolioTransaction)
                .where(eq(portfolioTransaction.userId, session.user.id))
                .orderBy(desc(portfolioTransaction.date))
            : Promise.resolve([])
    ]);

    const { nepalRates, goldHistory, silverHistory } = pricesData;

    // Default rates
    let initialRates = {
        gold: 0,
        silver: 0,
        date: new Date().toLocaleDateString()
    };

    if (nepalRates && nepalRates.length > 0) {
        // Find Tola prices
        const goldRate = nepalRates.find((r: NepalRate) => r.key === "fine-gold-tola")?.price ||
            nepalRates.find((r: NepalRate) => r.name === "Fine Gold" && r.unit === "Tola")?.price || 0;

        const silverRate = nepalRates.find((r: NepalRate) => r.key === "silver-tola")?.price ||
            nepalRates.find((r: NepalRate) => r.name === "Silver" && r.unit === "Tola")?.price || 0;

        const date = nepalRates[0]?.date || new Date().toISOString().split("T")[0];

        initialRates = {
            gold: goldRate,
            silver: silverRate,
            date: date
        };
    }

    const initialHistory = {
        gold: goldHistory || [],
        silver: silverHistory || []
    };

    // Serialize dates for Client Component
    const initialTransactions = transactionsData.map((tx) => ({
        ...tx,
        date: tx.date.toISOString().split("T")[0], // Format as YYYY-MM-DD
        // Ensure other fields match expected types if necessary
    }));

    return (
        <ProtectedRoute>
            <PortfolioClient
                initialRates={initialRates}
                initialHistory={initialHistory}
                initialTransactions={initialTransactions as PortfolioTransaction[]}
            />
        </ProtectedRoute>
    );
}
