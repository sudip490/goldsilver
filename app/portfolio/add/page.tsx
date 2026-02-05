import { AddTransactionForm } from "@/components/add-transaction-form";
import { fetchAllMetalPrices } from "@/lib/api-service";
import { NepalRate } from "@/lib/types";

export default async function AddTransactionPage() {
    const { nepalRates } = await fetchAllMetalPrices();

    // Extract gold and silver rates
    let rates = {
        gold: 0,
        silver: 0,
        date: new Date().toISOString().split('T')[0]
    };

    if (nepalRates && nepalRates.length > 0) {
        const goldRate = nepalRates.find((r: NepalRate) => r.key === "fine-gold-tola")?.price ||
            nepalRates.find((r: NepalRate) => r.name === "Fine Gold" && r.unit === "Tola")?.price || 0;

        const silverRate = nepalRates.find((r: NepalRate) => r.key === "silver-tola")?.price ||
            nepalRates.find((r: NepalRate) => r.name === "Silver" && r.unit === "Tola")?.price || 0;

        const date = nepalRates[0]?.date || new Date().toISOString().split("T")[0];

        rates = {
            gold: goldRate,
            silver: silverRate,
            date: date
        };
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            <div className="container py-8 max-w-2xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Add Transaction</h1>
                    <p className="text-muted-foreground mt-1">
                        Record a new gold or silver transaction.
                    </p>
                </div>

                <AddTransactionForm initialRates={rates} />
            </div>
        </div>
    );
}
