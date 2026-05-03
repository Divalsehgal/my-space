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
        if (typeof window === "undefined" || !window.matchMedia) {return false;}
        return window.matchMedia(query).matches;
    };

    const [matches, setMatches] = useState<boolean>(getMatch);

    useEnhancedEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) {return;}
        let active = true;
        const mediaQueryList = window.matchMedia(query);

        const listener = () => {
            if (!active) {return;}
            setMatches(mediaQueryList.matches);
        };

        // Modern browsers support addEventListener
        mediaQueryList.addEventListener("change", listener);
        setMatches(mediaQueryList.matches);

        return () => {
            active = false;
            mediaQueryList.removeEventListener("change", listener);
        };
    }, [query]);

    return matches;
}
