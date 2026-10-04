import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { I18nProvider, useLocale, useT } from "./client";
import { getDictionary, getT, LOCALES } from "./server";
import en from "./translations/en-US.json";

describe("i18n client", () => {
  it("falls back to the default locale outside a provider", () => {
    expect(renderHook(() => useLocale()).result.current).toBe("en-US");
    expect(renderHook(() => useT()).result.current("nav.home")).toBe(en["nav.home"]);
  });

  it("uses the provider's locale and dictionary", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <I18nProvider locale="de" dictionary={{ "nav.home": "Startseite" }}>
        {children}
      </I18nProvider>
    );
    expect(renderHook(() => useLocale(), { wrapper }).result.current).toBe("de");
    expect(renderHook(() => useT(), { wrapper }).result.current("nav.home")).toBe("Startseite");
  });

  it("defaults the provider's locale", () => {
    const wrapper = ({ children }: { children: ReactNode }) => <I18nProvider>{children}</I18nProvider>;
    expect(renderHook(() => useLocale(), { wrapper }).result.current).toBe("en-US");
  });
});

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
