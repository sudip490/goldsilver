import { NextRequest, NextResponse } from "next/server";
import { sendPriceUpdateEmail } from "@/lib/email-service";
import { db } from "@/db";
import { portfolioTransaction } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

// POST /api/send-price-update - Send price update email
export async function POST(req: NextRequest) {
    try {
        // Get authenticated user
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Get request body with price data
        const body = await req.json();
        const {
            goldPrice,
            silverPrice,
            goldChange,
            silverChange,
            goldChangePercent,
            silverChangePercent,
        } = body;

        // Get user's portfolio transactions
        const transactions = await db.query.portfolioTransaction.findMany({
            where: eq(portfolioTransaction.userId, userId),
        });

        if (transactions.length === 0) {
            return NextResponse.json(
                { error: "No portfolio transactions found" },
                { status: 404 }
            );
        }

        // Calculate portfolio metrics
        let totalInvestment = 0;
        let currentValue = 0;

        transactions.forEach((tx) => {
            const quantity = tx.quantity;
            const buyPrice = tx.price;

            if (tx.type === 'buy') {
                totalInvestment += buyPrice * quantity;

                // Calculate current value based on metal type
                const currentPrice = tx.metal === 'gold' ? goldPrice : silverPrice;
                currentValue += currentPrice * quantity;
            } else if (tx.type === 'sell') {
                // Subtract sold value from investment
                totalInvestment -= buyPrice * quantity;
                currentValue -= buyPrice * quantity;
            }
        });

        const totalProfitLoss = currentValue - totalInvestment;
        const totalProfitLossPercent = totalInvestment > 0
            ? (totalProfitLoss / totalInvestment) * 100
            : 0;

        // Calculate yesterday's value (approximation using price change)
        const yesterdayGoldPrice = goldPrice - goldChange;
        const yesterdaySilverPrice = silverPrice - silverChange;

        let yesterdayValue = 0;
        transactions.forEach((tx) => {
            if (tx.type === 'buy') {
                const quantity = tx.quantity;
                const yesterdayPrice = tx.metal === 'gold' ? yesterdayGoldPrice : yesterdaySilverPrice;
                yesterdayValue += yesterdayPrice * quantity;
            }
        });

        const todayProfitLoss = currentValue - yesterdayValue;
        const todayProfitLossPercent = yesterdayValue > 0
            ? (todayProfitLoss / yesterdayValue) * 100
            : 0;

        // Send email
        const result = await sendPriceUpdateEmail(
            session.user.email || 'user@example.com',
            session.user.name || 'User',
            {
                goldPrice,
                silverPrice,
                goldChange,
                silverChange,
                goldChangePercent,
                silverChangePercent,
            },
            {
                totalInvestment,
                currentValue,
                totalProfitLoss,
                totalProfitLossPercent,
                todayProfitLoss,
                todayProfitLossPercent,
            }
        );

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: "Price update email sent successfully",
                messageId: result.messageId,
            });
        } else {
            return NextResponse.json(
                { error: "Failed to send email", details: result.error },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Send price update error:", error);
        return NextResponse.json(
            {
                error: "Failed to send price update",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
