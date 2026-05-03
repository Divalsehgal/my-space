
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import FluidContainer from "./index";

describe("FluidContainer Component", () => {
  it("renders as a div by default", () => {
    render(<FluidContainer>Content</FluidContainer>);
    const container = screen.getByTestId("fluid-container");
    expect(container.tagName).toBe("DIV");
    expect(container).toHaveTextContent("Content");
  });

  it("renders as a custom element when 'as' prop is provided", () => {
    render(<FluidContainer as="section">Content</FluidContainer>);
    const container = screen.getByTestId("fluid-container");
    expect(container.tagName).toBe("SECTION");
  });

  it("applies custom class names", () => {
    render(<FluidContainer className="extra-class">Content</FluidContainer>);
    const container = screen.getByTestId("fluid-container");
    expect(container).toHaveClass("extra-class");
  });

  it("passes additional props to the element", () => {
    render(<FluidContainer id="test-id" aria-label="test-label">Content</FluidContainer>);
    const container = screen.getByTestId("fluid-container");
    expect(container).toHaveAttribute("id", "test-id");
    expect(container).toHaveAttribute("aria-label", "test-label");
  });
});
