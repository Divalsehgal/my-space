import { getDictionary, getT, LOCALES } from "./server";
import en from "./translations/en-US.json";

describe("i18n server", () => {
  it("exposes locales and dictionaries", () => {
    expect(LOCALES).toContain("en-US");
    expect(getDictionary()).toBe(getDictionary("en-US"));
    expect(getDictionary("xx")).toEqual({});
  });

  it("builds translators per locale, falling back to the default strings", () => {
    expect(getT()("nav.home")).toBe(en["nav.home"]);
    expect(getT("xx")("nav.home")).toBe(en["nav.home"]);
  });
});
