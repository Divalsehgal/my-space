import { DEFAULT_LOCALE } from "./config";
import defaultMessages from "./translations/en-US.json";

/** Every key that exists in the default locale. A typo is a type error. */
export type TranslationKey = keyof typeof defaultMessages;
export type Dictionary = Partial<Record<TranslationKey, string>>;
export type TranslationVars = Record<string, string | number>;

/** Keys authored as `<base>.one` / `<base>.other` (plus `.few`, `.many`… per locale). */
export type PluralBase = TranslationKey extends infer K ? (K extends `${infer B}.other` ? B : never) : never;

export type Translate = ((key: TranslationKey, vars?: TranslationVars) => string) & {
  /** Picks the plural form for `count` with Intl.PluralRules; `{count}` is filled in. */
  plural: (base: PluralBase, count: number, vars?: TranslationVars) => string;
};

const FALLBACK: Record<string, string> = defaultMessages;

/** Replaces `{name}` placeholders; unknown placeholders are left visible. */
export function format(template: string, vars?: TranslationVars): string {
  if (!vars) {return template;}
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/** A `t()` over one locale, falling back to the default locale, then to the key. */
export function createTranslator(dictionary?: Dictionary, locale: string = DEFAULT_LOCALE): Translate {
  const messages = (dictionary ?? {}) as Record<string, string | undefined>;
  const lookup = (key: string) => messages[key] ?? FALLBACK[key];
  const rules = new Intl.PluralRules(locale);
  const defaultRules = new Intl.PluralRules(DEFAULT_LOCALE);
  // The locale's own forms first; only then the default locale's, chosen by its own rules.
  const pluralForm = (source: Record<string, string | undefined>, base: string, category: string) =>
    source[`${base}.${category}`] ?? source[`${base}.other`];

  const t = ((key, vars) => format(lookup(key) ?? key, vars)) as Translate;
  t.plural = (base, count, vars) => {
    const template =
      pluralForm(messages, base, rules.select(count)) ?? pluralForm(FALLBACK, base, defaultRules.select(count)) ?? base;
    return format(template, { count, ...vars });
  };
  return t;
}
