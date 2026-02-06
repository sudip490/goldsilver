
import { PortfolioTransaction } from "@/lib/types";

export function exportTransactionsToCSV(transactions: PortfolioTransaction[]) {
    if (!transactions.length) return;

    const headers = ["Date", "Type", "Metal", "Quantity", "Unit", "Rate", "Total Price", "Notes"];

    const rows = transactions.map(tx => [
        tx.date,
        tx.type,
        tx.metal,
        tx.quantity,
        tx.unit,
        tx.rate,
        tx.price,
        `"${(tx.notes || "").replace(/"/g, '""')}"` // Escape quotes in notes
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `portfolio_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
