import { act, renderHook, waitFor } from "@testing-library/react";
import { useBlogViews } from "./useBlogViews";
import { isOwnerMode } from "@/utils/ownerMode";

jest.mock("@/utils/ownerMode", () => ({ isOwnerMode: jest.fn(() => false) }));

type ObserverCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

let observerCallback: ObserverCallback;
const observe = jest.fn();
const disconnect = jest.fn();

class MockIntersectionObserver {
  constructor(cb: ObserverCallback) {
    observerCallback = cb;
  }
  observe = observe;
  disconnect = disconnect;
}

const json = (body: unknown, ok = true) => Promise.resolve({ ok, json: async () => body } as Response);

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("useBlogViews", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock.mockReset();
    observe.mockClear();
    disconnect.mockClear();
    global.fetch = fetchMock as unknown as typeof fetch;
    (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver = MockIntersectionObserver;
    sessionStorage.clear();
    (isOwnerMode as jest.Mock).mockReturnValue(false);
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("loads the current count on mount", async () => {
    fetchMock.mockReturnValue(json({ views: 7 }));
    const { result } = renderHook(() => useBlogViews("post", { thresholdMs: 1000 }));
    await waitFor(() => expect(result.current.views).toBe(7));
    expect(fetchMock).toHaveBeenCalledWith("/api/blogs/post/view", { method: "GET", cache: "no-store" });
  });

  it("ignores failed or malformed count responses", async () => {
    fetchMock.mockReturnValueOnce(json(null, false));
    const { result } = renderHook(() => useBlogViews("a", { thresholdMs: 1000 }));
    fetchMock.mockReturnValueOnce(Promise.reject(new Error("offline")));
    const { result: second } = renderHook(() => useBlogViews("b", { thresholdMs: 1000 }));
    await act(() => Promise.resolve());
    expect(result.current.views).toBeNull();
    expect(second.current.views).toBeNull();
  });

  it("does nothing without a slug", () => {
    renderHook(() => useBlogViews(""));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(observe).not.toHaveBeenCalled();
  });

  it("records a view after the reading threshold and remembers it", async () => {
    fetchMock.mockReturnValueOnce(json({ views: 1 })).mockReturnValueOnce(json({ views: 2 }));
    const { result } = renderHook(() => useBlogViews("post", { thresholdMs: 1000 }));
    expect(observe).toHaveBeenCalledWith(document.documentElement);
    await act(() => Promise.resolve()); // let the initial GET settle first

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => expect(result.current.isTracked).toBe(true));
    expect(result.current.views).toBe(2);
    expect(fetchMock).toHaveBeenLastCalledWith("/api/blogs/post/view", { method: "POST", cache: "no-store" });
    expect(sessionStorage.getItem("blog_viewed_post")).toBe("1");
  });

  it("observes the article element when present", () => {
    fetchMock.mockReturnValue(json({}));
    const article = document.createElement("article");
    document.body.appendChild(article);
    renderHook(() => useBlogViews("post"));
    expect(observe).toHaveBeenCalledWith(article);
    article.remove();
  });

  it("pauses while hidden or scrolled away and resumes with the remaining time", async () => {
    fetchMock.mockReturnValue(json({}));
    renderHook(() => useBlogViews("post", { thresholdMs: 1000 }));

    act(() => jest.advanceTimersByTime(600));
    act(() => setVisibility("hidden"));
    act(() => jest.advanceTimersByTime(5000));
    expect(fetchMock).toHaveBeenCalledTimes(1); // only the GET

    act(() => setVisibility("visible"));
    act(() => observerCallback([{ isIntersecting: false }]));
    act(() => jest.advanceTimersByTime(5000));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    act(() => observerCallback([{ isIntersecting: true }]));
    act(() => observerCallback([{ isIntersecting: true }])); // already ticking
    await act(async () => {
      jest.advanceTimersByTime(399);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not mark tracked when the POST fails", async () => {
    fetchMock.mockReturnValueOnce(json({})).mockReturnValueOnce(json({}, false));
    const { result } = renderHook(() => useBlogViews("post", { thresholdMs: 10 }));
    await act(async () => {
      jest.advanceTimersByTime(10);
    });
    expect(result.current.isTracked).toBe(false);
    expect(sessionStorage.getItem("blog_viewed_post")).toBeNull();
  });

  it("swallows POST network errors and keeps the count when the response has none", async () => {
    fetchMock.mockReturnValueOnce(json({ views: 3 })).mockReturnValueOnce(Promise.reject(new Error("offline")));
    const { result } = renderHook(() => useBlogViews("post", { thresholdMs: 10 }));
    await act(async () => {
      jest.advanceTimersByTime(10);
    });
    expect(result.current.isTracked).toBe(false);

    fetchMock.mockReturnValueOnce(json({ views: 3 })).mockReturnValueOnce(json({}));
    const { result: other } = renderHook(() => useBlogViews("other", { thresholdMs: 10 }));
    await act(async () => {
      jest.advanceTimersByTime(10);
    });
    expect(other.current.isTracked).toBe(true);
    expect(other.current.views).toBe(3);
  });

  it("skips recording in owner mode or when already viewed this session", async () => {
    fetchMock.mockReturnValue(json({ views: 4 }));
    (isOwnerMode as jest.Mock).mockReturnValue(true);
    const { result } = renderHook(() => useBlogViews("post", { thresholdMs: 10 }));
    await act(async () => jest.runAllTicks()); // the tracked flag is set in a microtask
    expect(result.current.isTracked).toBe(true);
    expect(observe).not.toHaveBeenCalled();

    (isOwnerMode as jest.Mock).mockReturnValue(false);
    sessionStorage.setItem("blog_viewed_seen", "1");
    const { result: seen } = renderHook(() => useBlogViews("seen", { thresholdMs: 10 }));
    await act(async () => jest.runAllTicks());
    expect(seen.current.isTracked).toBe(true);
  });

  it("does not start the timer when the page is hidden on mount", () => {
    fetchMock.mockReturnValue(json({}));
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    renderHook(() => useBlogViews("post", { thresholdMs: 10 }));
    act(() => jest.advanceTimersByTime(100));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("cleans up the observer and listener on unmount", () => {
    fetchMock.mockReturnValue(json({}));
    const remove = jest.spyOn(document, "removeEventListener");
    const { unmount } = renderHook(() => useBlogViews("post", { thresholdMs: 1000 }));
    unmount();
    expect(disconnect).toHaveBeenCalled();
    expect(remove).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    remove.mockRestore();
  });
});
