import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { portfolioTransaction } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET - Fetch all portfolio transactions for the authenticated user
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const transactions = await db
            .select()
            .from(portfolioTransaction)
            .where(eq(portfolioTransaction.userId, session.user.id))
            .orderBy(desc(portfolioTransaction.date));

        return NextResponse.json({ transactions });
    } catch (error) {
        console.error("Error fetching portfolio transactions:", error);
        return NextResponse.json(
            { error: "Failed to fetch transactions" },
            { status: 500 }
        );
    }
}

// POST - Create a new portfolio transaction
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { type, metal, unit, quantity, price, rate, date, notes } = body;

        // Validation
        if (!type || !metal || !unit || !quantity || !price || !rate || !date) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const newTransaction = await db
            .insert(portfolioTransaction)
            .values({
                id: Date.now().toString(),
                userId: session.user.id,
                type,
                metal,
                unit,
                quantity: parseFloat(quantity),
                price: parseFloat(price),
                rate: parseFloat(rate),
                date: new Date(date),
                notes: notes || null,
            })
            .returning();

        return NextResponse.json({ transaction: newTransaction[0] }, { status: 201 });
    } catch (error) {
        console.error("Error creating portfolio transaction:", error);
        return NextResponse.json(
            { error: "Failed to create transaction" },
            { status: 500 }
        );
    }
}
