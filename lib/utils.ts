import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "NPR"): string {
    return new Intl.NumberFormat("en-NP", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount)
}

export function formatPercentage(value: number): string {
    const sign = value > 0 ? "+" : ""
    return `${sign}${value.toFixed(2)}%`
}

export function formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(new Date(date))
}

export function formatTime(date: Date | string): string {
    return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date))
}
