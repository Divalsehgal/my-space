import { createTranslator, format } from "./core";
import en from "./translations/en-US.json";

describe("i18n core", () => {
  it("fills placeholders and leaves unknown ones visible", () => {
    expect(format("Hi {name}, {missing}", { name: "Ada" })).toBe("Hi Ada, {missing}");
  });

  it("uses the dictionary, then the default locale, then the key", () => {
    const t = createTranslator({ "nav.home": "Startseite" }, "de");
    expect(t("nav.home")).toBe("Startseite");
    expect(t("nav.about")).toBe(en["nav.about"]);
    expect(t("not.a.key" as never)).toBe("not.a.key");
  });

  it("picks plural forms with Intl.PluralRules", () => {
    const t = createTranslator();
    expect(t.plural("views.count", 1, { formatted: "1" })).toBe("1 view");
    expect(t.plural("views.count", 5, { formatted: "5" })).toBe("5 views");
  });

  it("falls back to the `other` form when a locale lacks a category", () => {
    const t = createTranslator({ "card.showMore.other": "{count} weitere" }, "de");
    expect(t.plural("card.showMore", 1)).toBe("1 weitere");
  });

  it("keeps every key in dot.separated form", () => {
    for (const key of Object.keys(en)) {
      expect(key).toMatch(/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9_-]+)+$/);
    }
  });
});
