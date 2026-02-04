import { PortfolioClient } from "@/components/portfolio-client";
import { ProtectedRoute } from "@/components/protected-route";
import { fetchAllMetalPrices } from "@/lib/api-service";
import { NepalRate } from "@/lib/types";

export const revalidate = 300; // Revalidate every 5 minutes

export default async function PortfolioPage() {
    // Fetch latest prices for valuation
    const { nepalRates, goldHistory, silverHistory } = await fetchAllMetalPrices();

    // Default rates
    let initialRates = {
        gold: 0,
        silver: 0,
        date: new Date().toLocaleDateString()
    };

    if (nepalRates && nepalRates.length > 0) {
        // Find Tola prices
        const goldRate = nepalRates.find((r: NepalRate) => r.key === "fine-gold-tola")?.price ||
            nepalRates.find((r: NepalRate) => r.name === "Fine Gold" && r.unit === "Tola")?.price || 0;

        const silverRate = nepalRates.find((r: NepalRate) => r.key === "silver-tola")?.price ||
            nepalRates.find((r: NepalRate) => r.name === "Silver" && r.unit === "Tola")?.price || 0;

        const date = nepalRates[0]?.date || new Date().toISOString().split("T")[0];

        initialRates = {
            gold: goldRate,
            silver: silverRate,
            date: date
        };
    }

    const initialHistory = {
        gold: goldHistory || [],
        silver: silverHistory || []
    };

    return (
        <ProtectedRoute>
            <PortfolioClient initialRates={initialRates} initialHistory={initialHistory} />
        </ProtectedRoute>
    );
}
