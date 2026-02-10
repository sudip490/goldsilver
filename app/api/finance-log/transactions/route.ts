import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { khataTransaction } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

// GET /api/finance-log/transactions - List transactions
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const partyId = searchParams.get("partyId");

        let query = db
            .select()
            .from(khataTransaction)
            .where(eq(khataTransaction.userId, session.user.id))
            .orderBy(desc(khataTransaction.date));

        if (partyId) {
            query = db
                .select()
                .from(khataTransaction)
                .where(and(
                    eq(khataTransaction.userId, session.user.id),
                    eq(khataTransaction.partyId, partyId)
                ))
                .orderBy(desc(khataTransaction.date));
        }

        const transactions = await query;
        return NextResponse.json(transactions);
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch transactions" },
            { status: 500 }
        );
    }
}

// POST /api/finance-log/transactions - Create a new transaction
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            partyId,
            type, // 'gave' or 'got'
            amount,
            date,
            description,
            notes,
            attachmentUrl,
        } = body;

        if (!partyId || !type || !amount || !date || !description) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const newTransaction = await db
            .insert(khataTransaction)
            .values({
                id: `ktx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: session.user.id,
                partyId,
                type,
                amount: parseFloat(amount),
                date: new Date(date),
                description,
                notes,
                attachmentUrl,
            })
            .returning();

        return NextResponse.json(newTransaction[0], { status: 201 });
    } catch {
        return NextResponse.json(
            { error: "Failed to create transaction" },
            { status: 500 }
        );
    }
}
