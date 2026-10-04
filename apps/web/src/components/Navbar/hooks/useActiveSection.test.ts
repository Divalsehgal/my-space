import { act, renderHook } from "@testing-library/react";
import { useActiveSection } from "./useActiveSection";

type Callback = (entries: Array<{ isIntersecting: boolean; target: Element }>) => void;

describe("useActiveSection", () => {
  let callback: Callback;
  const observe = jest.fn();
  const disconnect = jest.fn();
  const original = global.IntersectionObserver;

  beforeEach(() => {
    observe.mockClear();
    disconnect.mockClear();
    (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
      constructor(cb: Callback) {
        callback = cb;
      }
      observe = observe;
      disconnect = disconnect;
    };
    document.body.innerHTML = `<section id="skills"></section><section id="projects"></section>`;
  });

  afterEach(() => {
    global.IntersectionObserver = original;
    document.body.innerHTML = "";
  });

  it("reports the first visible home section", () => {
    const { result, unmount } = renderHook(() => useActiveSection());
    expect(observe).toHaveBeenCalledTimes(2);
    expect(result.current).toBeNull();

    const projects = document.getElementById("projects") as HTMLElement;
    const skills = document.getElementById("skills") as HTMLElement;
    act(() => callback([{ isIntersecting: false, target: skills }, { isIntersecting: true, target: projects }]));
    expect(result.current).toBe("/#projects");

    act(() => callback([{ isIntersecting: false, target: projects }]));
    expect(result.current).toBe("/#projects");

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it("does nothing when no sections are on the page", () => {
    document.body.innerHTML = "";
    const { result } = renderHook(() => useActiveSection());
    expect(observe).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it("does nothing without IntersectionObserver", () => {
    (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver = undefined;
    const { result } = renderHook(() => useActiveSection());
    expect(result.current).toBeNull();
  });
});
