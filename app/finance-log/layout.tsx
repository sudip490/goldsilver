import { FinanceLogSettingsProvider } from "@/components/finance-log-settings-context";

export default function FinanceLogLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <FinanceLogSettingsProvider>
            {children}
        </FinanceLogSettingsProvider>
    );
}
