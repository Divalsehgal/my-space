import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ReactFlowProvider, type NodeProps } from "@xyflow/react";
import ArchitectureNode from "./index";
import { type ArchitectureFlowNode } from "./constants";

const buildProps = (overrides: Partial<NodeProps<ArchitectureFlowNode>> = {}): NodeProps<ArchitectureFlowNode> => ({
  id: "node-1",
  data: { label: "Next.js" },
  type: "frontend",
  dragging: false,
  zIndex: 0,
  selectable: true,
  deletable: true,
  selected: false,
  draggable: false,
  isConnectable: false,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
  ...overrides,
});

const renderNode = (props: Partial<NodeProps<ArchitectureFlowNode>> = {}) =>
  render(
    <ReactFlowProvider>
      <ArchitectureNode {...buildProps(props)} />
    </ReactFlowProvider>,
  );

describe("ArchitectureNode Component", () => {
  it("renders the node label", () => {
    renderNode({ data: { label: "Contentful" } });

    expect(screen.getByText("Contentful")).toBeInTheDocument();
  });

  it("falls back to the default type when none is given", () => {
    renderNode({ type: undefined });

    expect(screen.getByText("Next.js").closest("div")).toHaveAttribute("data-type", "default");
  });

  it("marks the node as selected", () => {
    renderNode({ selected: true });

    expect(screen.getByText("Next.js").closest("div")).toHaveAttribute("data-selected", "true");
  });
});
