"use client";

import { useState, useEffect, useLayoutEffect } from "react";

const useEnhancedEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * useMediaQuery(query)
 * Returns boolean based on the media query string.
 */
export function useMediaQuery(query: string): boolean {
    const getMatch = () => {
        if (typeof window === "undefined") return false;
        return window.matchMedia(query).matches;
    };

    const [matches, setMatches] = useState<boolean>(getMatch);

    useEnhancedEffect(() => {
        const mediaQueryList = window.matchMedia(query);

        const listener = () => setMatches(mediaQueryList.matches);

        // Call immediately to sync state
        listener();

        mediaQueryList.addEventListener("change", listener);
        return () => mediaQueryList.removeEventListener("change", listener);
    }, [query]);

    return matches;
}
