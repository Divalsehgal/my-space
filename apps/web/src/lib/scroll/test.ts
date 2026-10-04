import type Lenis from "lenis";
import { lockScroll, onLenis, registerLenis, unlockScroll } from "./index";

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

describe("onLenis", () => {
  afterEach(() => registerLenis(null));

  it("calls back immediately when ready, on changes, and stops after unsubscribe", () => {
    const first = {} as Lenis;
    const second = {} as Lenis;
    registerLenis(first);
    const listener = jest.fn();
    const unsubscribe = onLenis(listener);
    expect(listener).toHaveBeenCalledWith(first);
    registerLenis(second);
    expect(listener).toHaveBeenCalledWith(second);
    unsubscribe();
    registerLenis(null);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("waits for registration when Lenis is not ready", () => {
    const listener = jest.fn();
    const unsubscribe = onLenis(listener);
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});
