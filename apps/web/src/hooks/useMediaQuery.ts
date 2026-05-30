"use client";

import { useSyncExternalStore } from "react";

/**
 * useMediaQuery(query)
 * Returns boolean based on the media query string using useSyncExternalStore.
 */
export function useMediaQuery(query: string): boolean {
    const subscribe = (callback: () => void) => {
        if (typeof window === "undefined" || !window.matchMedia) {
        }
        const mediaQueryList = window.matchMedia(query);
        mediaQueryList.addEventListener("change", callback);
        return () => mediaQueryList.removeEventListener("change", callback);
    };

    const getSnapshot = () => {
        if (typeof window === "undefined" || !window.matchMedia) {
            return false;
        }
        return window.matchMedia(query).matches;
    };

    const getServerSnapshot = () => {
        return false;
    };

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
