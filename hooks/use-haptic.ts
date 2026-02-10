"use client";

import { useCallback, useEffect, useState } from 'react';

/**
 * Vibration patterns for different events
 */
export const HAPTIC_PATTERNS = {
    // Light tap for button presses
    light: [50],
    // Medium pulse for notifications
    medium: [100],
    // Strong pulse for alerts
    strong: [200],
    // Double tap for success
    success: [50, 100, 50],
    // Triple pulse for errors
    error: [100, 50, 100, 50, 100],
    // Long pulse for warnings
    warning: [150, 100, 150],
    // Heartbeat pattern for price alerts
    priceAlert: [200, 100, 200, 100, 400],
} as const;

export type HapticPattern = keyof typeof HAPTIC_PATTERNS;

interface UseHapticReturn {
    vibrate: (pattern: HapticPattern | number | number[]) => void;
    isSupported: boolean;
    isEnabled: boolean;
    setEnabled: (enabled: boolean) => void;
}

/**
 * Hook for haptic feedback using the Vibration API
 * Provides different vibration patterns for various user interactions
 * Gracefully degrades on unsupported devices
 */
export function useHaptic(): UseHapticReturn {
    const [isSupported, setIsSupported] = useState(false);
    const [isEnabled, setIsEnabled] = useState(true);

    useEffect(() => {
        // Check if Vibration API is supported
        const supported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
        setIsSupported(supported);

        // Load user preference from localStorage
        if (typeof window !== 'undefined') {
            const savedPreference = localStorage.getItem('haptic-enabled');
            if (savedPreference !== null) {
                setIsEnabled(savedPreference === 'true');
            }
        }
    }, []);

    const vibrate = useCallback((pattern: HapticPattern | number | number[]) => {
        // Don't vibrate if not supported or disabled
        if (!isSupported || !isEnabled) return;

        try {
            let vibrationPattern: number | number[];

            // If pattern is a string key, get the predefined pattern
            if (typeof pattern === 'string') {
                vibrationPattern = [...HAPTIC_PATTERNS[pattern]];
            } else {
                vibrationPattern = pattern;
            }

            // Trigger vibration
            navigator.vibrate(vibrationPattern);
        } catch {
        }
    }, [isSupported, isEnabled]);

    const setEnabledWithPersistence = useCallback((enabled: boolean) => {
        setIsEnabled(enabled);
        if (typeof window !== 'undefined') {
            localStorage.setItem('haptic-enabled', String(enabled));
        }
    }, []);

    return {
        vibrate,
        isSupported,
        isEnabled,
        setEnabled: setEnabledWithPersistence,
    };
}
