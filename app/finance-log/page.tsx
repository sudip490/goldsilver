import { FinanceLogDashboard } from "@/components/finance-log-dashboard";
import { ProtectedRoute } from "@/components/protected-route";

export const metadata = {
    title: "Finance Log | Gold & Silver Tracker",
    description: "Manage your debts and credits with ease.",
};

export default function FinanceLogPage() {
    return (
        <ProtectedRoute>
            <div className="container py-8 max-w-5xl">
                <FinanceLogDashboard />
            </div>
        </ProtectedRoute>
    );
}
