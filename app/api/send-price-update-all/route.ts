import { NextRequest, NextResponse } from "next/server";
import { sendPriceUpdateEmail, sendPriceOnlyEmail } from "@/lib/email-service";
import { db } from "@/db";
import { portfolioTransaction } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/send-price-update-all - Send price update emails to ALL users
export async function POST(req: NextRequest) {
    try {
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

        // Get ALL users from database
        const allUsers = await db.query.user.findMany();

        if (allUsers.length === 0) {
            return NextResponse.json(
                { error: "No users found" },
                { status: 404 }
            );
        }

        const results = [];
        let successCount = 0;
        let failCount = 0;
        let priceOnlyCount = 0;

        // Send email to each user
        for (const currentUser of allUsers) {
            try {
                if (!currentUser.email) {
                    continue;
                }

                // Get user's portfolio transactions
                const transactions = await db.query.portfolioTransaction.findMany({
                    where: eq(portfolioTransaction.userId, currentUser.id),
                });

                // If user has no transactions, send price-only email
                if (transactions.length === 0) {
                    const emailResult = await sendPriceOnlyEmail(
                        currentUser.email,
                        currentUser.name || 'User',
                        {
                            goldPrice,
                            silverPrice,
                            goldChange,
                            silverChange,
                            goldChangePercent,
                            silverChangePercent,
                        }
                    );

                    if (emailResult.success) {
                        successCount++;
                        priceOnlyCount++;
                        results.push({
                            email: currentUser.email,
                            status: 'sent (price-only)',
                            messageId: emailResult.messageId,
                        });
                    } else {
                        failCount++;
                        results.push({
                            email: currentUser.email,
                            status: 'failed',
                            error: emailResult.error,
                        });
                    }

                    // Add delay to avoid Gmail rate limits
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }

                // Calculate portfolio metrics for this user
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

                // Send portfolio email to this user
                const emailResult = await sendPriceUpdateEmail(
                    currentUser.email,
                    currentUser.name || 'User',
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

                if (emailResult.success) {
                    successCount++;
                    results.push({
                        email: currentUser.email,
                        status: 'sent (with portfolio)',
                        messageId: emailResult.messageId,
                    });
                } else {
                    failCount++;
                    results.push({
                        email: currentUser.email,
                        status: 'failed',
                        error: emailResult.error,
                    });
                }

                // Add small delay to avoid Gmail rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (userError) {
                failCount++;
                results.push({
                    email: currentUser.email,
                    status: 'error',
                    error: userError instanceof Error ? userError.message : String(userError),
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Emails sent to ${successCount} users (${priceOnlyCount} price-only), ${failCount} failed`,
            totalUsers: allUsers.length,
            successCount,
            priceOnlyCount,
            failCount,
            results,
        });

    } catch (error) {
        console.error("Send price update error:", error);
        return NextResponse.json(
            {
                error: "Failed to send price updates",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
