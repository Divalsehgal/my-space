
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import GlassCard from "./index";

describe("GlassCard Component", () => {
  it("renders with minimum required props (string description)", () => {
    render(<GlassCard title="Test Title" description="Test Description" />);
    
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("renders with description as an array of objects", () => {
    const listDescription = [
      { id: "1", text: "First Item" },
      { id: "2", text: "Second Item" },
    ];
    
    render(<GlassCard title="List Title" description={listDescription} />);
    
    expect(screen.getByText("First Item")).toBeInTheDocument();
    expect(screen.getByText("Second Item")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders with a visual component", () => {
    const VisualMock = <div data-testid="visual-mock">Visual Content</div>;
    
    render(<GlassCard title="Visual Title" description="Desc" visual={VisualMock} />);
    
    expect(screen.getByTestId("visual-mock")).toBeInTheDocument();
  });

  it("renders with tags", () => {
    const tags = ["React", "TypeScript", "Jest"];
    
    render(<GlassCard title="Tags Title" description="Desc" tags={tags} />);
    
    tags.forEach((tag) => {
      expect(screen.getByText(tag)).toBeInTheDocument();
    });
  });

  it("renders with an action element", () => {
    const ActionMock = <button data-testid="action-mock">Click Me</button>;
    
    render(<GlassCard title="Action Title" description="Desc" action={ActionMock} />);
    
    expect(screen.getByTestId("action-mock")).toBeInTheDocument();
    expect(screen.getByText("Click Me")).toBeInTheDocument();
  });

  it("applies a custom className", () => {
    const { container } = render(
      <GlassCard title="Class Title" description="Desc" className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders list items without an id by using text as key fallback", () => {
    const listDescription = [
      { text: "Item Without ID" },
    ];
    
    render(<GlassCard title="List Title" description={listDescription} />);
    expect(screen.getByText("Item Without ID")).toBeInTheDocument();
  });
});
