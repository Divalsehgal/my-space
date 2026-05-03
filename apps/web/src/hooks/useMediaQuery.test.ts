import { renderHook, act } from "@testing-library/react";
import { useMediaQuery } from "./useMediaQuery";

describe("useMediaQuery Hook", () => {
  let addEventListenerMock: jest.Mock;
  let removeEventListenerMock: jest.Mock;
  let mockMediaQueryList: any;

  beforeEach(() => {
    addEventListenerMock = jest.fn();
    removeEventListenerMock = jest.fn();

    mockMediaQueryList = {
      matches: true,
      media: "(min-width: 768px)",
      onchange: null,
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      dispatchEvent: jest.fn(),
    };

    // Mock window.matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: jest.fn().mockImplementation(() => {
        return mockMediaQueryList;
      }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns true if the media query matches initially", () => {
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("returns false if the media query does not match initially", () => {
    mockMediaQueryList.matches = false;
    const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
    expect(result.current).toBe(false);
  });

  it("sets up and tears down event listeners", () => {
    const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    
    expect(addEventListenerMock).toHaveBeenCalledTimes(1);
    expect(addEventListenerMock).toHaveBeenCalledWith("change", expect.any(Function));

    unmount();
    
    expect(removeEventListenerMock).toHaveBeenCalledTimes(1);
    expect(removeEventListenerMock).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("updates state when media query change event is triggered", () => {
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(true);

    const listener = addEventListenerMock.mock.calls[0][1];

    act(() => {
      mockMediaQueryList.matches = false;
      listener();
    });

    expect(result.current).toBe(false);
  });

  it("handles missing window.matchMedia gracefully", () => {
    const originalMatchMedia = window.matchMedia;
    // @ts-ignore
    delete window.matchMedia;

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);

    window.matchMedia = originalMatchMedia;
  });

  it("stops listening when active is false during unmount", () => {
    const { result, unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    
    const listener = addEventListenerMock.mock.calls[0][1];
    unmount();

    act(() => {
      mockMediaQueryList.matches = false;
      listener();
    });

    // Should still be true because listener returned early
    expect(result.current).toBe(true);
  });
});
