import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Skills from ".";
import type { SkillsConfig } from "@/features/portfolio";

describe("Skills Container", () => {
  it("renders nothing when there is no data", () => {
    const { container } = render(<Skills />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders flat categories when provided", () => {
    const categories: SkillsConfig = {
      languages: [{ name: "TypeScript" }, { name: "Python" }],
      aiEngineering: [{ name: "MCP" }],
    };

    render(<Skills categories={categories} />);

    expect(screen.getByText("Skills")).toBeInTheDocument();
    expect(screen.getByText("Languages")).toBeInTheDocument();
    expect(screen.getByText("AI Engineering")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("MCP")).toBeInTheDocument();
  });

  it("renders nested sub-groups and preserves config key order", () => {
    const categories: SkillsConfig = {
      frontend: {
        frameworks: [{ name: "React" }, { name: "Next.js" }],
        styling: [{ name: "Tailwind CSS" }],
      },
    };

    render(<Skills categories={categories} />);

    expect(screen.getByText("Frontend")).toBeInTheDocument();
    expect(screen.getByText("Frameworks")).toBeInTheDocument();
    expect(screen.getByText("Styling")).toBeInTheDocument();
    expect(screen.getByText("Next.js")).toBeInTheDocument();

    const titles = screen.getAllByText(/Frameworks|Styling/).map((el) => el.textContent);
    expect(titles).toEqual(["Frameworks", "Styling"]);
  });

  it("skips empty groups and sub-groups", () => {
    const categories: SkillsConfig = {
      cloud: { aws: [{ name: "Lambda" }], azure: [] },
      contentPlatforms: [],
    };

    render(<Skills categories={categories} />);

    expect(screen.getByText("AWS")).toBeInTheDocument();
    expect(screen.queryByText("Azure")).not.toBeInTheDocument();
    expect(screen.queryByText("Content Platforms")).not.toBeInTheDocument();
  });
});
