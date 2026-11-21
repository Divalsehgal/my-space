import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ArchitectureWidget from "./index";

describe("ArchitectureWidget", () => {
  it("links to the architecture route with its title and summary", () => {
    render(<ArchitectureWidget />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/architecture");
    expect(link).toHaveTextContent("Architecture");
    expect(link).toHaveTextContent("How this site is built, end to end.");
  });

  it("draws one row of dots per generated layer", () => {
    const { container } = render(<ArchitectureWidget />);
    const map = container.querySelector("svg");
    expect(map).toHaveAttribute("data-layers", "5");
    const rows = new Set([...container.querySelectorAll("circle")].map((dot) => dot.getAttribute("cy")));
    expect(rows.size).toBe(5);
  });
});
