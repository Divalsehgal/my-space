"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_LOCALE } from "./config";
import { createTranslator, type Dictionary, type Translate } from "./core";

type I18nValue = { locale: string; t: Translate };

const I18nContext = createContext<I18nValue | null>(null);

/**
 * Hands the active locale's strings to client components. For the default
 * locale no dictionary is passed: the client already bundles it as the
 * fallback, so it isn't serialised into every page a second time.
 */
export function I18nProvider({
  locale = DEFAULT_LOCALE,
  dictionary,
  children,
}: Readonly<{ locale?: string; dictionary?: Dictionary; children: ReactNode }>) {
  const value = useMemo(() => ({ locale, t: createTranslator(dictionary, locale) }), [locale, dictionary]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

const defaultValue: I18nValue = { locale: DEFAULT_LOCALE, t: createTranslator() };

/** `t()` for client components; outside a provider (e.g. tests) it uses the default locale. */
export function useT(): Translate {
  return (useContext(I18nContext) ?? defaultValue).t;
}

export function useLocale(): string {
  return (useContext(I18nContext) ?? defaultValue).locale;
}
