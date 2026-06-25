"use client";

import { useEffect, useState } from "react";

/**
 * useMediaQuery(query)
 * Returns boolean based on the media query string, with a server-safe initial state.
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (globalThis.window === undefined || !globalThis.matchMedia) {
            return;
        }

        const mediaQueryList = globalThis.matchMedia(query);

        const updateMatch = () => {
            setMatches(mediaQueryList.matches);
        };

        updateMatch();
        mediaQueryList.addEventListener("change", updateMatch);

        return () => {
            mediaQueryList.removeEventListener("change", updateMatch);
        };
    }, [query]);

    return matches;
}
