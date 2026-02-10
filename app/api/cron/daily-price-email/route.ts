import { NextRequest, NextResponse } from "next/server";
import { fetchAllMetalPrices } from "@/lib/api-service";

// GET /api/cron/daily-price-email - Cron job to send daily price emails
// This should be called by a cron service (e.g., Vercel Cron, GitHub Actions, or external cron)
export async function GET(req: NextRequest) {
    try {
        // Verify cron secret to prevent unauthorized access
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here';

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Fetch current prices
        const pricesData = await fetchAllMetalPrices();
        const { nepalRates } = pricesData;

        if (!nepalRates || nepalRates.length === 0) {
            return NextResponse.json(
                { error: "Failed to fetch prices" },
                { status: 500 }
            );
        }

        // Extract gold and silver prices
        const goldRate = nepalRates.find((r: { key: string; price: number }) => r.key === "fine-gold-tola")?.price || 0;
        const silverRate = nepalRates.find((r: { key: string; price: number }) => r.key === "silver-tola")?.price || 0;

        // Calculate price changes (you'll need to store yesterday's prices)
        // For now, using placeholder values
        const goldChange = 500; // TODO: Calculate from stored yesterday's price
        const silverChange = -50;
        const goldChangePercent = goldRate > 0 ? (goldChange / goldRate) * 100 : 0;
        const silverChangePercent = silverRate > 0 ? (silverChange / silverRate) * 100 : 0;

        // Trigger email sending
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-price-update-all`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                goldPrice: goldRate,
                silverPrice: silverRate,
                goldChange,
                silverChange,
                goldChangePercent,
                silverChangePercent,
            }),
        });

        const emailResult = await emailResponse.json();

        return NextResponse.json({
            success: true,
            message: 'Daily price emails sent successfully',
            emailResult,
        });

    } catch (error) {
        console.error('[CRON] Error in daily price email job:', error);
        return NextResponse.json(
            {
                error: "Failed to send daily price emails",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
