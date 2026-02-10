import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { khataParty, khataTransaction } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// GET /api/finance-log/view/[token] - Get party details using share token (no auth required)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const resolvedParams = await params;
        const shareToken = resolvedParams.token;

        if (!shareToken) {
            return NextResponse.json(
                { error: "Share token is required" },
                { status: 400 }
            );
        }

        // Find party by share token
        const party = await db.query.khataParty.findFirst({
            where: eq(khataParty.shareToken, shareToken),
        });

        if (!party) {
            return NextResponse.json(
                { error: "Invalid or expired share link" },
                { status: 404 }
            );
        }

        // Check if token is older than 30 days (optional expiry)
        if (party.shareTokenCreatedAt) {
            const tokenAge = Date.now() - new Date(party.shareTokenCreatedAt).getTime();
            const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

            if (tokenAge > thirtyDaysInMs) {
                return NextResponse.json(
                    { error: "Share link has expired" },
                    { status: 410 }
                );
            }
        }

        // Get transactions for this party
        const transactions = await db
            .select()
            .from(khataTransaction)
            .where(eq(khataTransaction.partyId, party.id))
            .orderBy(sql`${khataTransaction.date} DESC`);

        // Calculate balance
        let balance = 0;
        transactions.forEach(tx => {
            if (tx.type === 'gave') {
                balance += tx.amount;
            } else {
                balance -= tx.amount;
            }
        });

        // Return party info and transactions (read-only)
        return NextResponse.json({
            party: {
                name: party.name,
                type: party.type,
                balance,
            },
            transactions: transactions.map(tx => ({
                id: tx.id,
                type: tx.type,
                amount: tx.amount,
                date: tx.date,
                description: tx.description,
                notes: tx.notes,
            })),
        });
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch data" },
            { status: 500 }
        );
    }
}
