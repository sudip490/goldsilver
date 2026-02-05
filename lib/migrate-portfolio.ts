/**
 * Utility to migrate portfolio transactions from localStorage to database
 * This should be called once when a user logs in for the first time
 */

export async function migrateLocalStorageToDatabase() {
    try {
        // Check if there's data in localStorage
        const saved = localStorage.getItem("portfolio_transactions");
        if (!saved) {
            return { success: true, message: "No data to migrate" };
        }

        const transactions = JSON.parse(saved);
        if (!Array.isArray(transactions) || transactions.length === 0) {
            return { success: true, message: "No transactions to migrate" };
        }

        // Send all transactions to the server
        const results = await Promise.allSettled(
            transactions.map(async (tx) => {
                const response = await fetch('/api/portfolio', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: tx.type,
                        metal: tx.metal,
                        unit: tx.unit,
                        quantity: tx.quantity,
                        price: tx.price,
                        rate: tx.rate,
                        date: tx.date,
                        notes: tx.notes || '',
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to migrate transaction ${tx.id}`);
                }

                return response.json();
            })
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        if (failed === 0) {
            // Clear localStorage after successful migration
            localStorage.removeItem("portfolio_transactions");
            return {
                success: true,
                message: `Successfully migrated ${successful} transactions`,
            };
        } else {
            return {
                success: false,
                message: `Migrated ${successful} transactions, ${failed} failed`,
            };
        }
    } catch (error) {
        console.error("Migration error:", error);
        return {
            success: false,
            message: "Failed to migrate data",
            error,
        };
    }
}
