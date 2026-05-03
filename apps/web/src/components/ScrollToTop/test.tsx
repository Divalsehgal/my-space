
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScrollToTop from "./index";

describe("ScrollToTop Component", () => {
  const originalScrollY = window.scrollY;
  const originalScrollTo = window.scrollTo;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
    Object.defineProperty(window, 'scrollY', { value: originalScrollY, writable: true });
    window.scrollTo = originalScrollTo;
  });

  beforeEach(() => {
    window.scrollTo = jest.fn();
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("does not render initially when scrollY is 0", () => {
    const { container } = render(<ScrollToTop />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders when window is scrolled past 300px", () => {
    render(<ScrollToTop />);
    
    act(() => {
      window.scrollY = 400;
      fireEvent.scroll(window);
    });

    const button = screen.getByLabelText("scroll to top");
    expect(button).toBeInTheDocument();
  });

  it("calls window.scrollTo and manages scrollSnapType on click", () => {
    render(<ScrollToTop />);
    
    act(() => {
      window.scrollY = 400;
      fireEvent.scroll(window);
    });

    const button = screen.getByLabelText("scroll to top");
    fireEvent.click(button);

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
    
    // Check scrollSnap is disabled
    expect(document.documentElement.style.scrollSnapType).toBe("none");

    // Advance timer to test re-enabling scrollSnap
    act(() => {
      jest.advanceTimersByTime(800);
    });

    expect(document.documentElement.style.scrollSnapType).toBe("y mandatory");
  });

  it("hides when scrolled back to top", () => {
    render(<ScrollToTop />);
    
    act(() => {
      window.scrollY = 400;
      fireEvent.scroll(window);
    });

    expect(screen.getByLabelText("scroll to top")).toBeInTheDocument();

    act(() => {
      window.scrollY = 100;
      fireEvent.scroll(window);
    });

    expect(screen.queryByLabelText("scroll to top")).not.toBeInTheDocument();
  });

  it("clears timeouts and event listeners on unmount", () => {
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
    
    const { unmount } = render(<ScrollToTop />);
    
    act(() => {
      window.scrollY = 400;
      fireEvent.scroll(window);
    });

    const button = screen.getByLabelText("scroll to top");
    fireEvent.click(button); // Starts a timeout

    unmount();
    
    // Check listener removal
    expect(removeEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    
    // Since we unmounted, the timeout should be cleared and NOT fire the scroll snap reset
    act(() => {
      jest.advanceTimersByTime(800);
    });
    // the scrollSnapType is 'none' right before unmount, it should remain 'none' since the timeout was cleared
    expect(document.documentElement.style.scrollSnapType).toBe("none");
  });

  it("clears existing timeout when clicked rapidly", () => {
    render(<ScrollToTop />);
    act(() => {
      window.scrollY = 400;
      fireEvent.scroll(window);
    });

    const button = screen.getByLabelText("scroll to top");
    
    fireEvent.click(button);
    act(() => {
      jest.advanceTimersByTime(400);
    });
    
    // Click again before first timeout finishes
    fireEvent.click(button);
    
    act(() => {
      jest.advanceTimersByTime(500);
    });
    // First timeout was cleared, so scrollSnap is still 'none' because only 500ms passed for the second timeout
    expect(document.documentElement.style.scrollSnapType).toBe("none");

    act(() => {
      jest.advanceTimersByTime(300);
    });
    // Now second timeout finishes
    expect(document.documentElement.style.scrollSnapType).toBe("y mandatory");
  });
});
