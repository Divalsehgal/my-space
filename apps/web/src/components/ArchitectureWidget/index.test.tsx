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
});
