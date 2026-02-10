// Utility to trigger price update email
// This should be called when new prices are detected

interface PriceChangeData {
    goldPrice: number;
    silverPrice: number;
    goldChange: number;
    silverChange: number;
    goldChangePercent: number;
    silverChangePercent: number;
}

export async function triggerPriceUpdateEmail(priceData: PriceChangeData) {
    try {
        const response = await fetch('/api/send-price-update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(priceData),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Failed to send price update email:', error);
            return { success: false, error };
        }

        const result = await response.json();
        console.log('Price update email sent successfully:', result);
        return { success: true, result };
    } catch (error) {
        console.error('Error triggering price update email:', error);
        return { success: false, error };
    }
}

// Function to check if prices have changed significantly (> 0.1%)
export function hasSignificantPriceChange(
    oldPrice: number,
    newPrice: number,
    threshold: number = 0.1
): boolean {
    if (oldPrice === 0) return false;
    const changePercent = Math.abs(((newPrice - oldPrice) / oldPrice) * 100);
    return changePercent >= threshold;
}

// Store last sent email timestamp in localStorage to avoid spam
const EMAIL_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

export function canSendEmail(): boolean {
    if (typeof window === 'undefined') return false;

    const lastSent = localStorage.getItem('lastPriceEmailSent');
    if (!lastSent) return true;

    const timeSinceLastSent = Date.now() - parseInt(lastSent);
    return timeSinceLastSent >= EMAIL_COOLDOWN_MS;
}

export function markEmailSent() {
    if (typeof window === 'undefined') return;
    localStorage.setItem('lastPriceEmailSent', Date.now().toString());
}
