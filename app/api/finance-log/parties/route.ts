import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { khataParty, khataTransaction } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

// GET /api/finance-log/parties - List all parties with their current balance
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get query params for filtering
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type"); // 'customer', 'supplier', etc.

        // Let's rewrite using the query builder properly
        const whereClause = type
            ? sql`${khataParty.userId} = ${session.user.id} AND ${khataParty.type} = ${type}`
            : eq(khataParty.userId, session.user.id);

        const results = await db
            .select({
                id: khataParty.id,
                name: khataParty.name,
                phone: khataParty.phone,
                type: khataParty.type,
                notes: khataParty.notes,
                updatedAt: khataParty.updatedAt,
                balance: sql<number>`COALESCE(SUM(CASE WHEN ${khataTransaction.type} = 'gave' THEN ${khataTransaction.amount} ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN ${khataTransaction.type} = 'got' THEN ${khataTransaction.amount} ELSE 0 END), 0)`
            })
            .from(khataParty)
            .leftJoin(khataTransaction, eq(khataParty.id, khataTransaction.partyId))
            .where(whereClause)
            .groupBy(khataParty.id)
            .orderBy(desc(khataParty.updatedAt));

        return NextResponse.json(results);
    } catch (error) {
        console.error("Error fetching finance log parties:", error);
        return NextResponse.json(
            { error: "Failed to fetch parties" },
            { status: 500 }
        );
    }
}

// POST /api/finance-log/parties - Create a new party
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, phone, email, type, notes } = body;

        if (!name || !type) {
            return NextResponse.json(
                { error: "Name and type are required" },
                { status: 400 }
            );
        }

        const newParty = await db
            .insert(khataParty)
            .values({
                id: `party_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: session.user.id,
                name,
                phone,
                email,
                type, // 'customer', 'supplier', 'staff', 'personal'
                notes,
            })
            .returning();

        return NextResponse.json(newParty[0], { status: 201 });
    } catch (error) {
        console.error("Error creating party:", error);
        return NextResponse.json(
            { error: "Failed to create party" },
            { status: 500 }
        );
    }
}
