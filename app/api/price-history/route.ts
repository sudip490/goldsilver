import { NextResponse } from 'next/server';
import { db } from '@/db';
import { nepalRatesHistory, notificationLog } from '@/db/schema';
import { desc, gte, and, eq } from 'drizzle-orm';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'nepal'; // 'nepal' or 'notifications'
        const days = parseInt(searchParams.get('days') || '30');
        const metal = searchParams.get('metal'); // 'Fine Gold', 'Silver', etc.

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        if (type === 'notifications') {
            // Get notification history
            const notifications = await db
                .select()
                .from(notificationLog)
                .where(gte(notificationLog.date, startDate))
                .orderBy(desc(notificationLog.date))
                .limit(100);

            return NextResponse.json({
                type: 'notifications',
                count: notifications.length,
                data: notifications,
            });
        } else {
            // Get Nepal rates history
            let query = db
                .select()
                .from(nepalRatesHistory)
                .where(gte(nepalRatesHistory.date, startDate));

            if (metal) {
                query = db
                    .select()
                    .from(nepalRatesHistory)
                    .where(
                        and(
                            gte(nepalRatesHistory.date, startDate),
                            eq(nepalRatesHistory.name, metal)
                        )
                    );
            }

            const history = await query
                .orderBy(desc(nepalRatesHistory.date))
                .limit(1000);

            // Group by date for easier consumption
            const groupedByDate: Record<string, typeof history> = {};
            history.forEach(record => {
                const dateKey = record.date.toISOString().split('T')[0];
                if (!groupedByDate[dateKey]) {
                    groupedByDate[dateKey] = [];
                }
                groupedByDate[dateKey].push(record);
            });

            return NextResponse.json({
                type: 'nepal_rates',
                days,
                metal: metal || 'all',
                count: history.length,
                data: history,
                groupedByDate,
            });
        }
    } catch (error) {
        console.error('Failed to fetch price history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch price history' },
            { status: 500 }
        );
    }
}
