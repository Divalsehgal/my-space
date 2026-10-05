import { act, fireEvent, render, screen } from "@testing-library/react";
import { animate } from "framer-motion";
import "@testing-library/jest-dom";
import HeroDeck from "./index";

jest.mock("next/link", () =>
  function MockLink({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  },
);

jest.mock("framer-motion", () => ({
  ...jest.requireActual("framer-motion"),
  animate: jest.fn(() => Promise.resolve()),
}));

const animateMock = animate as unknown as jest.Mock;

function mockMedia({ wide = true, reduced = false } = {}) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: query.includes("min-width") ? wide : query.includes("reduce") && reduced,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })) as unknown as typeof window.matchMedia;
}

const props = {
  latestPost: { slug: "inside-every-api-call", title: "Inside Every API Call", relativeLabel: "Published 3 weeks ago" },
  currentRole: { role: "Senior Software Engineer", company: "EPAM Systems" },
  skills: ["React", "Next.js", "TypeScript", "Node.js", "GraphQL", "Python", "AWS"],
};

describe("HeroDeck", () => {
  // The interactive stacked deck is the tablet-and-up layout.
  beforeAll(() => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query.includes("min-width"),
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })) as unknown as typeof window.matchMedia;
  });

  it("leads with the portrait", () => {
    const { container } = render(<HeroDeck {...props} />);
    const front = container.querySelector(".deck__card--front");
    expect(front).toContainElement(screen.getByAltText("Portrait of Dival Sehgal"));
  });

  it("shows the latest post, current role and top skills", () => {
    render(<HeroDeck {...props} />);
    expect(screen.getByText("Inside Every API Call")).toBeInTheDocument();
    expect(screen.getAllByText(/Published/)).toHaveLength(1);
    expect(screen.getByText(/Read it/).closest("a")).toHaveAttribute("href", "/blogs/inside-every-api-call");
    expect(screen.getByText("EPAM Systems")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.queryByText("AWS")).not.toBeInTheDocument(); // top six only
  });

  it("falls back to the blog index without a latest post", () => {
    render(<HeroDeck skills={[]} />);
    expect(screen.getByText(/Browse the blog/).closest("a")).toHaveAttribute("href", "/blogs");
  });

  it("brings a clicked card to the front", () => {
    const { container } = render(<HeroDeck {...props} />);
    fireEvent.click(screen.getByText("EPAM Systems").closest("div") as HTMLElement);
    expect(container.querySelector(".deck__card--front")).toHaveTextContent("EPAM Systems");
  });

  describe("motion", () => {
    const frontText = (container: HTMLElement) => container.querySelector(".deck__card--front")?.textContent ?? "";

    beforeEach(() => {
      jest.useFakeTimers();
      animateMock.mockClear();
    });

    afterEach(() => {
      jest.useRealTimers();
      mockMedia();
    });

    it("auto-rotates the front card to the back, tossing it first", async () => {
      mockMedia();
      const { container } = render(<HeroDeck {...props} />);
      expect(frontText(container)).not.toContain("EPAM Systems");
      animateMock.mockClear();

      await act(async () => {
        jest.advanceTimersByTime(4500);
      });
      expect(frontText(container)).toContain("EPAM Systems");
      expect(animateMock).toHaveBeenCalledWith(expect.any(HTMLElement), { x: 220, y: -30, rotate: 18 }, expect.anything());
    });

    it("pauses auto-rotation while hovered or focused, and fans the deck on hover", () => {
      mockMedia();
      const { container } = render(<HeroDeck {...props} />);
      const deck = container.firstElementChild as HTMLElement;
      const before = frontText(container);

      fireEvent.mouseEnter(deck);
      expect(animateMock).toHaveBeenCalledWith(expect.any(HTMLElement), { x: -100, y: -12, rotate: -10, scale: 1 }, expect.anything());
      act(() => jest.advanceTimersByTime(9000));
      expect(frontText(container)).toBe(before);
      fireEvent.mouseLeave(deck);

      fireEvent.focus(deck);
      act(() => jest.advanceTimersByTime(9000));
      expect(frontText(container)).toBe(before);
      fireEvent.blur(deck);
    });

    it("does not rotate while the tab is hidden", () => {
      mockMedia();
      const visibility = jest.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
      const { container } = render(<HeroDeck {...props} />);
      const before = frontText(container);
      act(() => jest.advanceTimersByTime(9000));
      expect(frontText(container)).toBe(before);
      visibility.mockRestore();
    });

    it("places cards instantly and never auto-rotates for reduced motion", () => {
      mockMedia({ reduced: true });
      const { container } = render(<HeroDeck {...props} />);
      expect(animateMock).toHaveBeenCalledWith(expect.any(HTMLElement), expect.anything(), expect.objectContaining({ duration: 0 }));
      const before = frontText(container);
      act(() => jest.advanceTimersByTime(9000));
      expect(frontText(container)).toBe(before);
    });

    it("skips the deck animations on phone layouts", () => {
      mockMedia({ wide: false });
      const { container } = render(<HeroDeck {...props} />);
      fireEvent.mouseEnter(container.firstElementChild as HTMLElement);
      expect(animateMock).not.toHaveBeenCalled();
    });
  });
});
