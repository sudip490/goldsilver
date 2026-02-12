import { db } from "@/db";
import { portfolioTransaction } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendPriceUpdateEmail, sendPriceOnlyEmail } from "@/lib/email-service";

export type NotificationResult = {
    email: string;
    status: string;
    messageId?: string;
    error?: unknown;
};

export type PriceData = {
    goldPrice: number;
    silverPrice: number;
    goldChange: number;
    silverChange: number;
    goldChangePercent: number;
    silverChangePercent: number;
};

export async function sendPriceNotificationsToAllUsers(priceData: PriceData) {
    try {
        // Get ALL users from database
        const allUsers = await db.query.user.findMany();

        if (allUsers.length === 0) {
            return {
                success: false,
                message: "No users found",
                totalUsers: 0,
                successCount: 0,
                failCount: 0
            };
        }

        const results: NotificationResult[] = [];
        let successCount = 0;
        let failCount = 0;
        let priceOnlyCount = 0;

        console.log(`📧 Starting notification blast to ${allUsers.length} users...`);

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
                        priceData
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
                        console.error(`Failed to send email to ${currentUser.email}:`, emailResult.error);
                    }

                    // Add delay to avoid Gmail rate limits
                    await new Promise(resolve => setTimeout(resolve, 500)); // Reduced to 500ms
                    continue;
                }

                // Calculate portfolio metrics for this user
                let totalCost = 0;
                let totalSoldValue = 0;
                let goldQty = 0;
                let silverQty = 0;

                transactions.forEach((tx) => {
                    // Normalize quantity to Tola
                    const qty = tx.unit === 'gram' ? tx.quantity / 11.66 : tx.quantity;

                    if (tx.type === 'buy') {
                        if (tx.metal === 'gold') goldQty += qty;
                        else silverQty += qty;
                        totalCost += tx.price;
                    } else if (tx.type === 'sell') {
                        if (tx.metal === 'gold') goldQty -= qty;
                        else silverQty -= qty;
                        totalSoldValue += tx.price;
                    }
                });

                // Calculate current value based on net holdings
                const currentGoldValue = goldQty * priceData.goldPrice;
                const currentSilverValue = silverQty * priceData.silverPrice;
                const currentValue = currentGoldValue + currentSilverValue;

                // Net Investment Cost (Total Spend - Total Returned from Sells)
                const totalInvestment = totalCost - totalSoldValue;

                const totalProfitLoss = currentValue - totalInvestment;
                const totalProfitLossPercent = totalInvestment > 0
                    ? (totalProfitLoss / totalInvestment) * 100
                    : 0;

                // Calculate yesterday's value
                const yesterdayGoldPrice = priceData.goldPrice - priceData.goldChange;
                const yesterdaySilverPrice = priceData.silverPrice - priceData.silverChange;

                const yesterdayValue = (goldQty * yesterdayGoldPrice) + (silverQty * yesterdaySilverPrice);

                const todayProfitLoss = currentValue - yesterdayValue;
                const todayProfitLossPercent = yesterdayValue > 0
                    ? (todayProfitLoss / yesterdayValue) * 100
                    : 0;

                // Send portfolio email to this user
                const emailResult = await sendPriceUpdateEmail(
                    currentUser.email,
                    currentUser.name || 'User',
                    priceData,
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
                    console.error(`Failed to send portfolio email to ${currentUser.email}:`, emailResult.error);
                }

                // Add small delay to avoid Gmail rate limits
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (userError) {
                failCount++;
                results.push({
                    email: currentUser.email,
                    status: 'error',
                    error: userError instanceof Error ? userError.message : String(userError),
                });
                console.error(`Error processing user ${currentUser.email}:`, userError);
            }
        }

        return {
            success: true,
            message: `Emails sent to ${successCount} users (${priceOnlyCount} price-only), ${failCount} failed`,
            totalUsers: allUsers.length,
            successCount,
            priceOnlyCount,
            failCount,
            results,
        };

    } catch (error) {
        console.error("Send price update error:", error);
        return {
            success: false,
            message: "Failed to send price updates",
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
