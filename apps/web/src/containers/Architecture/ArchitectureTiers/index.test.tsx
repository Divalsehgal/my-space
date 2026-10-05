import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ArchitectureTiers from "./index";

const nodes = [
  { id: "browser", tier: "client" as const, type: "frontend" as const, position: { x: 0, y: 0 }, data: { label: "Browser" } },
  { id: "next", type: "backend" as const, position: { x: 0, y: 200 }, data: { label: "Next.js", description: "App Router" } },
  { id: "cms", type: "external" as const, position: { x: 0, y: 400 }, data: { label: "Contentful" } },
];
const edges = [
  { id: "e1", source: "browser", target: "next", label: "requests" },
  { id: "e2", source: "next", target: "cms" },
];

describe("ArchitectureTiers", () => {
  it("groups components into tiers, inferring tiers from rows when missing", () => {
    render(<ArchitectureTiers nodes={nodes} edges={edges} />);
    expect(screen.getByRole("heading", { name: "Client" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Servers" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Data & services" })).toBeInTheDocument();
  });

  it("lists each component's descriptions and outgoing connections", () => {
    render(<ArchitectureTiers nodes={nodes} edges={edges} />);
    expect(screen.getByText("App Router")).toBeInTheDocument();
    expect(screen.getByText("(requests)")).toBeInTheDocument();
    expect(screen.getAllByText("Contentful").length).toBeGreaterThan(1); // card + connection
  });
});
