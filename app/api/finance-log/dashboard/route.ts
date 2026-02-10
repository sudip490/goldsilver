import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { sql } from "drizzle-orm";

// GET /api/finance-log/dashboard - Get overall balance summary
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Calculate total "You'll Get" (Receivables) and "You'll Give" (Payables)
        // This requires grouping by party first to get net balance per party
        // Then summing positive vs negative balances

        // Can we do this in one query?
        // SELECT 
        //   SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END) as totalReceivable,
        //   SUM(CASE WHEN balance < 0 THEN ABS(balance) ELSE 0 END) as totalPayable
        // FROM (
        //   SELECT party_id, SUM(CASE WHEN type='gave' THEN amount ELSE -amount END) as balance
        //   FROM khata_transaction WHERE user_id = ? GROUP BY party_id
        // ) as party_balances

        // Drizzle raw SQL is easiest here
        const result = await db.execute(sql`
            WITH PartyBalances AS (
                SELECT 
                    party_id, 
                    SUM(CASE WHEN type = 'gave' THEN amount ELSE -amount END) as balance
                FROM khata_transaction
                WHERE user_id = ${session.user.id}
                GROUP BY party_id
            )
            SELECT 
                COALESCE(SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END), 0) as totalReceivable,
                COALESCE(SUM(CASE WHEN balance < 0 THEN ABS(balance) ELSE 0 END), 0) as totalPayable
            FROM PartyBalances
        `);

        // result.rows[0] contains the data
        const summary = result.rows[0];

        return NextResponse.json({
            totalReceivable: Number(summary.totalreceivable || 0),
            totalPayable: Number(summary.totalpayable || 0),
            netBalance: Number(summary.totalreceivable || 0) - Number(summary.totalpayable || 0)
        });

    } catch {
        return NextResponse.json(
            { error: "Failed to fetch dashboard data" },
            { status: 500 }
        );
    }
}
