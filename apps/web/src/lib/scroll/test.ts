import type Lenis from "lenis";
import { lockScroll, registerLenis, unlockScroll } from "./index";

describe("scroll lock", () => {
  afterEach(() => registerLenis(null));

  it("pauses Lenis and the document while locked", () => {
    const lenis = { stop: jest.fn(), start: jest.fn() };
    registerLenis(lenis as unknown as Lenis);
    lockScroll();
    expect(lenis.stop).toHaveBeenCalled();
    expect(document.documentElement.style.overflow).toBe("hidden");
    unlockScroll();
    expect(lenis.start).toHaveBeenCalled();
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("still locks the document without Lenis", () => {
    lockScroll();
    expect(document.documentElement.style.overflow).toBe("hidden");
    unlockScroll();
    expect(document.documentElement.style.overflow).toBe("");
  });
});
