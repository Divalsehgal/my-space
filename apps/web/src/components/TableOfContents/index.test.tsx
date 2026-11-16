import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import TableOfContents from "./index";

describe("TableOfContents", () => {
  const items = [
    { id: "intro", text: "Introduction", level: 1 },
    { id: "setup", text: "Setup Guide", level: 3 },
  ];

  beforeAll(() => {
    class MockIntersectionObserver {
      observe = jest.fn();
      disconnect = jest.fn();
      unobserve = jest.fn();
    }
    Object.defineProperty(window, "IntersectionObserver", {
      writable: true,
      configurable: true,
      value: MockIntersectionObserver,
    });
  });

  it("returns null if items is empty", () => {
    const { container } = render(<TableOfContents items={[]} title="TOC" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders native anchor links for each heading", () => {
    const heading = document.createElement("h2");
    heading.id = "intro";
    document.body.appendChild(heading);

    render(<TableOfContents items={items} title="Contents" />);

    expect(screen.getByText("Contents")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Introduction" });
    expect(link).toHaveAttribute("href", "#intro");

    document.body.removeChild(heading);
  });
});
