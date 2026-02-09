import { FinanceLogPartyDetails } from "@/components/finance-log-party-details";
import { ProtectedRoute } from "@/components/protected-route";

export const metadata = {
    title: "Party Details | Khata Book",
    description: "Manage transactions for a specific contact.",
};

export default function FinanceLogPartyPage() {
    return (
        <ProtectedRoute>
            <div className="container py-8 max-w-4xl">
                <FinanceLogPartyDetails />
            </div>
        </ProtectedRoute>
    );
}
