
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SectionHeader from "./index";

describe("SectionHeader Component", () => {
  it("renders correctly with title only", () => {
    render(<SectionHeader title="Main Title" />);
    expect(screen.getByText("Main Title")).toBeInTheDocument();
  });

  it("renders with eyebrow and subtitle", () => {
    render(
      <SectionHeader 
        eyebrow="Eyebrow Text" 
        title="Title" 
        subtitle="Subtitle text here" 
      />
    );
    expect(screen.getByText("Eyebrow Text")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Subtitle text here")).toBeInTheDocument();
  });

  it("renders with center alignment and contact variant", () => {
    const { container } = render(
      <SectionHeader title="Title" align="center" variant="contact" />
    );
    const header = container.firstChild as HTMLElement;
    expect(header.className).toContain("section-header--center");
    expect(header.className).toContain("section-header--contact");
  });

  it("returns null if no content props are provided", () => {
    const { container } = render(<SectionHeader />);
    expect(container).toBeEmptyDOMElement();
  });

  it("applies custom class names", () => {
    render(
      <SectionHeader 
        title="Title" 
        className="custom-root" 
        titleClassName="custom-title" 
        subtitle="Sub"
        subtitleClassName="custom-sub"
      />
    );
    expect(screen.getByText("Title").parentElement?.className).toContain("custom-root");
    expect(screen.getByText("Title")).toHaveClass("custom-title");
    expect(screen.getByText("Sub")).toHaveClass("custom-sub");
  });
});
