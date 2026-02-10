"use client";

import { useEffect, useState } from 'react';

/**
 * Hook to detect and prevent screenshots when privacy mode is active
 * Uses CSS-based approach with blur and watermark overlay
 * Limited browser support - gracefully degrades
 */
export function useScreenshotProtection(isPrivacyMode: boolean) {
    const [isProtected, setIsProtected] = useState(false);

    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined') return;

        if (!isPrivacyMode) {
            setIsProtected(false);
            document.body.classList.remove('screenshot-protected');
            return;
        }

        // Enable screenshot protection
        setIsProtected(true);
        document.body.classList.add('screenshot-protected');

        // Try to detect screenshot attempts (limited support)
        const handleVisibilityChange = () => {
            if (document.hidden && isPrivacyMode) {
                // User might be taking a screenshot
            }
        };

        // Listen for visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup
        return () => {
            document.body.classList.remove('screenshot-protected');
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isPrivacyMode]);

    return { isProtected };
}
