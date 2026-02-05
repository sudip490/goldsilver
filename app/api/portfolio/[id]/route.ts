import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { portfolioTransaction } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

// DELETE - Delete a specific portfolio transaction
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;

        // Delete only if the transaction belongs to the user
        const result = await db
            .delete(portfolioTransaction)
            .where(
                and(
                    eq(portfolioTransaction.id, id),
                    eq(portfolioTransaction.userId, session.user.id)
                )
            )
            .returning();

        if (result.length === 0) {
            return NextResponse.json(
                { error: "Transaction not found or unauthorized" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting portfolio transaction:", error);
        return NextResponse.json(
            { error: "Failed to delete transaction" },
            { status: 500 }
        );
    }
}
