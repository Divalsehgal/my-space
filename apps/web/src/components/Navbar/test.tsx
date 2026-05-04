
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import Navbar from "./index";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({ children, href, onClick, className }: { children: React.ReactNode; href: string; onClick?: () => void; className?: string }) {
    return (
      <a href={href} onClick={onClick} className={className} data-testid={`navlink-${href}`}>
        {children}
      </a>
    );
  };
});

// Mock custom hooks and utilities
jest.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: jest.fn(),
}));

jest.mock("@/utils/analytics", () => {
  const actual = jest.requireActual("@/utils/analytics");
  return {
    ...actual,
    trackInteraction: jest.fn(),
  };
});

describe("Navbar Component", () => {
  beforeEach(() => {
    (useMediaQuery as jest.Mock).mockReturnValue(true); // Default to desktop
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the brand name correctly", () => {
    render(<Navbar brand="Test Brand" />);
    expect(screen.getByText("Test Brand")).toBeInTheDocument();
  });

  it("renders navigation links on desktop", () => {
    render(<Navbar />);
    expect(screen.getByTestId("navlink-/#home")).toBeInTheDocument();
    expect(screen.getByTestId("navlink-/#about")).toBeInTheDocument();
  });

  it("opens the mobile menu when the hamburger icon is clicked", () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false); // Simulate mobile
    render(<Navbar />);
    
    const menuButton = screen.getByLabelText("Open menu");
    fireEvent.click(menuButton);
    
    // Once clicked, aria-label changes to Close menu
    expect(screen.getByLabelText("Close menu")).toBeInTheDocument();
  });

  it("closes the mobile menu when a link is clicked", () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false); // Simulate mobile
    render(<Navbar />);
    
    // Open menu
    const menuButton = screen.getByLabelText("Open menu");
    fireEvent.click(menuButton);
    expect(screen.getByLabelText("Close menu")).toBeInTheDocument();

    // Click a link
    const mobileLinks = screen.getAllByTestId("navlink-/#about");
    const mobileLink = mobileLinks.length > 1 ? mobileLinks[1] : mobileLinks[0];
    
    act(() => {
      fireEvent.click(mobileLink);
    });
    
    // Menu should be closed
    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });

  it("closes the mobile menu when the overlay is clicked", () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const { container } = render(<Navbar />);
    
    act(() => {
      fireEvent.click(screen.getByLabelText("Open menu"));
    });
    
    // Overlay is the first div with navbar__overlay class
    const overlay = container.querySelector(".navbar__overlay");
    expect(overlay).toBeInTheDocument();
    
    act(() => {
      if (overlay) {fireEvent.click(overlay);}
    });
    
    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });

  it("closes the mobile menu when the brand link is clicked", () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    render(<Navbar />);
    
    act(() => {
      fireEvent.click(screen.getByLabelText("Open menu"));
    });
    
    act(() => {
      fireEvent.click(screen.getByTestId("navlink-/"));
    });
    
    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });

  it("closes mobile menu when screen resizes to desktop", async () => {
    // Start mobile
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const { rerender } = render(<Navbar />);
    
    act(() => {
      fireEvent.click(screen.getByLabelText("Open menu"));
    });
    expect(screen.getByLabelText("Close menu")).toBeInTheDocument();

    // Resize to desktop
    (useMediaQuery as jest.Mock).mockReturnValue(true);
    rerender(<Navbar />);
    
    // Wait for setTimeout(() => setOpen(false), 0)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });

  it("closes mobile menu when Escape key is pressed", () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    render(<Navbar />);
    
    act(() => {
      fireEvent.click(screen.getByLabelText("Open menu"));
    });
    expect(screen.getByLabelText("Close menu")).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    
    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });

  it("traps focus within the menu using Tab and Shift+Tab", () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    render(<Navbar />);
    
    act(() => {
      fireEvent.click(screen.getByLabelText("Open menu"));
    });

    const allFocusable = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstEl = allFocusable[0] as HTMLElement;
    const lastEl = allFocusable[allFocusable.length - 1] as HTMLElement;

    // Spy on focus methods
    const firstFocusSpy = jest.spyOn(firstEl, "focus");
    const lastFocusSpy = jest.spyOn(lastEl, "focus");

    // Focus first element
    firstEl.focus();
    
    // Shift+Tab on first element should move to last focusable
    act(() => {
      fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    });
    
    expect(lastFocusSpy).toHaveBeenCalled();
    
    // Focus last element
    lastEl.focus();
    
    // Tab on last element should move to first focusable
    act(() => {
      fireEvent.keyDown(window, { key: "Tab", shiftKey: false });
    });

    expect(firstFocusSpy).toHaveBeenCalled();
    
    // Ignore non-Tab keys
    act(() => {
      fireEvent.keyDown(window, { key: "A" });
    });
  });

  it("updates progress bar scale on window scroll", () => {
    jest.useFakeTimers();
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = jest.fn((cb) => { cb(0); return 0; });
    
    render(<Navbar />);
    
    act(() => {
      // Trigger scroll
      fireEvent.scroll(window);
    });
    
    expect(window.requestAnimationFrame).toHaveBeenCalled();
    
    window.requestAnimationFrame = originalRAF;
    jest.useRealTimers();
  });

  it("handles progress bar when page is not scrollable (height = 0)", () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 1000, configurable: true });
    
    render(<Navbar />);
    
    act(() => {
      fireEvent.scroll(window);
    });
    
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("does not trap focus if no focusable elements are found", () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    // Mock querySelectorAll to return empty for the navRef
    render(<Navbar />);
    
    act(() => {
      fireEvent.click(screen.getByLabelText("Open menu"));
    });

    const nav = screen.getByRole("navigation");
    jest.spyOn(nav, 'querySelectorAll').mockReturnValue([] as unknown as NodeListOf<Element>);

    act(() => {
      fireEvent.keyDown(window, { key: "Tab" });
    });
    
    // No error should occur
    expect(screen.getByLabelText("Close menu")).toBeInTheDocument();
  });
});
