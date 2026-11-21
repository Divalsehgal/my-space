
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScrollToTop from "./index";

describe("ScrollToTop Component", () => {
  const originalScrollY = window.scrollY;
  const originalScrollTo = window.scrollTo;

  afterAll(() => {
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

    const button = screen.getByLabelText("Scroll to top");
    expect(button).toBeInTheDocument();
  });

  it("scrolls smoothly to the top on click", () => {
    render(<ScrollToTop />);

    act(() => {
      window.scrollY = 400;
      fireEvent.scroll(window);
    });

    fireEvent.click(screen.getByLabelText("Scroll to top"));

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("hides when scrolled back to top", () => {
    render(<ScrollToTop />);
    
    act(() => {
      window.scrollY = 400;
      fireEvent.scroll(window);
    });

    expect(screen.getByLabelText("Scroll to top")).toBeInTheDocument();

    act(() => {
      window.scrollY = 100;
      fireEvent.scroll(window);
    });

    expect(screen.queryByLabelText("scroll to top")).not.toBeInTheDocument();
  });

  it("removes its scroll listener on unmount", () => {
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = render(<ScrollToTop />);
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
  });
});
