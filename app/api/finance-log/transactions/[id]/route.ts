import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { khataTransaction } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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
        const transactionId = resolvedParams.id;

        if (!transactionId) {
            return NextResponse.json(
                { error: "Transaction ID is required" },
                { status: 400 }
            );
        }

        // Check if transaction exists and belongs to user
        const existingTransaction = await db.query.khataTransaction.findFirst({
            where: and(
                eq(khataTransaction.id, transactionId),
                eq(khataTransaction.userId, session.user.id)
            ),
        });

        if (!existingTransaction) {
            return NextResponse.json(
                { error: "Transaction not found or unauthorized" },
                { status: 404 }
            );
        }

        await db
            .delete(khataTransaction)
            .where(eq(khataTransaction.id, transactionId));

        return NextResponse.json({ message: "Transaction deleted successfully" });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return NextResponse.json(
            { error: "Failed to delete transaction" },
            { status: 500 }
        );
    }
}
