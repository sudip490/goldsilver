import { useEffect, useState } from "react"

export function useMediaQuery(query: string) {
    const [matches, setMatches] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        // Check if window is defined to prevent issues during SSR
        if (typeof window === 'undefined') {
            return;
        }

        const media = window.matchMedia(query);

        // Set initial value
        setMatches(media.matches);

        // Listen for changes
        const listener = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        media.addEventListener("change", listener);
        return () => media.removeEventListener("change", listener);
    }, [query]);

    return matches;
}
