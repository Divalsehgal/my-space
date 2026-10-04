import "server-only";

import { DEFAULT_LOCALE } from "./config";
import { createTranslator, type Dictionary, type Translate } from "./core";
import { DICTIONARIES } from "./translations";

/**
 * Server-side access to every locale. Server components only: importing this
 * from a client component would ship all locales to the browser — client code
 * uses `useT()` from "@/i18n/client" instead.
 */
export const LOCALES = Object.keys(DICTIONARIES);

export function getDictionary(locale: string = DEFAULT_LOCALE): Dictionary {
  return (DICTIONARIES as Record<string, Dictionary>)[locale] ?? {};
}

export function getT(locale: string = DEFAULT_LOCALE): Translate {
  return createTranslator(getDictionary(locale), locale);
}
