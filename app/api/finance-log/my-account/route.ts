import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { khataParty, khataTransaction, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/finance-log/my-account - Get ALL finance logs for the logged-in user's email
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Please log in to view your account" },
                { status: 401 }
            );
        }

        const userEmail = session.user.email;

        // Find ALL parties with this email (customer might have accounts with multiple businesses)
        const parties = await db.query.khataParty.findMany({
            where: eq(khataParty.email, userEmail),
        });

        if (!parties || parties.length === 0) {
            return NextResponse.json(
                {
                    error: "No account found",
                    message: "Your email is not linked to any finance log. Please contact the business owner."
                },
                { status: 404 }
            );
        }

        // Get all accounts with their business owners and transactions
        const accounts = await Promise.all(
            parties.map(async (party) => {
                // Get the business owner information
                const owner = await db.query.user.findFirst({
                    where: eq(user.id, party.userId),
                });

                // Get all transactions for this party
                const transactions = await db.query.khataTransaction.findMany({
                    where: eq(khataTransaction.partyId, party.id),
                    orderBy: [desc(khataTransaction.date)],
                });

                // Calculate balance from transactions (from customer's perspective)
                // Negative balance = Customer owes money (needs to pay)
                // Positive balance = Customer will receive money
                const balance = transactions.reduce((acc, tx) => {
                    if (tx.type === 'gave') {
                        return acc - tx.amount; // Customer paid, reduces their debt
                    } else {
                        return acc + tx.amount; // Customer received/bought, increases their debt
                    }
                }, 0);

                return {
                    businessOwner: {
                        name: owner?.name || "Business Owner",
                        email: owner?.email,
                        id: owner?.id,
                    },
                    party: {
                        id: party.id,
                        name: party.name,
                        type: party.type,
                        balance: balance,
                        phone: party.phone,
                    },
                    transactions: transactions.map(tx => ({
                        id: tx.id,
                        type: tx.type,
                        amount: tx.amount,
                        date: tx.date,
                        description: tx.description,
                        notes: tx.notes,
                    })),
                };
            })
        );

        return NextResponse.json({ accounts });
    } catch (error) {
        console.error("My account fetch error:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch your account",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
