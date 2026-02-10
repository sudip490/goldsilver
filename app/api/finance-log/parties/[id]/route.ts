import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { khataParty, khataTransaction } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// GET /api/khata/parties/[id] - Get party details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const partyId = resolvedParams.id;

        if (!partyId) {
            return NextResponse.json(
                { error: "Party ID is required" },
                { status: 400 }
            );
        }

        const party = await db
            .select({
                id: khataParty.id,
                name: khataParty.name,
                phone: khataParty.phone,
                email: khataParty.email,
                type: khataParty.type,
                notes: khataParty.notes,
                updatedAt: khataParty.updatedAt,
                balance: sql<number>`COALESCE(SUM(CASE WHEN ${khataTransaction.type} = 'gave' THEN ${khataTransaction.amount} ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN ${khataTransaction.type} = 'got' THEN ${khataTransaction.amount} ELSE 0 END), 0)`
            })
            .from(khataParty)
            .leftJoin(khataTransaction, eq(khataParty.id, khataTransaction.partyId))
            .where(
                and(
                    eq(khataParty.id, partyId),
                    eq(khataParty.userId, session.user.id)
                )
            )
            .groupBy(khataParty.id);

        if (!party || party.length === 0) {
            return NextResponse.json(
                { error: "Party not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(party[0]);
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch party" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const partyId = resolvedParams.id;

        if (!partyId) {
            return NextResponse.json(
                { error: "Party ID is required" },
                { status: 400 }
            );
        }

        // Verify the party belongs to the user
        const party = await db.query.khataParty.findFirst({
            where: and(
                eq(khataParty.id, partyId),
                eq(khataParty.userId, session.user.id)
            ),
        });

        if (!party) {
            return NextResponse.json(
                { error: "Party not found or unauthorized" },
                { status: 404 }
            );
        }

        // Delete all transactions associated with this party
        await db
            .delete(khataTransaction)
            .where(
                and(
                    eq(khataTransaction.partyId, partyId),
                    eq(khataTransaction.userId, session.user.id)
                )
            );

        // Delete the party itself
        await db
            .delete(khataParty)
            .where(
                and(
                    eq(khataParty.id, partyId),
                    eq(khataParty.userId, session.user.id)
                )
            );

        return NextResponse.json({ message: "Party and transactions deleted successfully" });
    } catch {
        return NextResponse.json(
            { error: "Failed to delete party" },
            { status: 500 }
        );
    }
}
