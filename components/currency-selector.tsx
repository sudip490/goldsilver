"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useFinanceLogSettings } from "./finance-log-settings-context";

export function CurrencySelector() {
    const { currency, setCurrency } = useFinanceLogSettings();

    return (
        <Select value={currency} onValueChange={(value: "NPR" | "INR" | "USD") => setCurrency(value)}>
            <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="NPR">Rs (NPR)</SelectItem>
                <SelectItem value="INR">₹ (INR)</SelectItem>
                <SelectItem value="USD">$ (USD)</SelectItem>
            </SelectContent>
        </Select>
    );
}
