import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BLOCKS } from "@contentful/rich-text-types";
import { BlogSteps } from ".";
import { renderContentfulRichText } from "../ContentfulRenderer";
import type { ContentfulRichText } from "@/types";

const steps = [
  { id: "a", title: "Parse", content: <p>Read the source.</p> },
  { id: "b", title: "Render", content: <p>Build the tree.</p> },
  { id: "c", title: "Commit", content: null },
];

describe("BlogSteps", () => {
  it("renders nothing without steps", () => {
    const { container } = render(<BlogSteps title="Pipeline" steps={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows one numbered step at a time and pages with the controls", () => {
    render(<BlogSteps title="Pipeline" steps={steps} />);

    expect(screen.getByRole("region", { name: "Pipeline" })).toBeInTheDocument();
    expect(screen.getByText("Pipeline 1 / 3")).toBeInTheDocument();
    expect(screen.getByText("Read the source.")).toBeVisible();
    expect(screen.getByText("Build the tree.")).not.toBeVisible();

    fireEvent.click(screen.getByLabelText("Next"));
    expect(screen.getByText("Build the tree.")).toBeVisible();
    expect(screen.getByText("Pipeline 2 / 3")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /Go to slide/i })[2]);
    expect(screen.getByText("Commit")).toBeVisible();
  });

  it("hides paging controls for a single step", () => {
    render(<BlogSteps title="Solo" steps={steps.slice(0, 1)} />);
    expect(screen.queryByLabelText("Next")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Go to slide/i })).not.toBeInTheDocument();
  });
});

describe("embedded blogSteps entries in rich text", () => {
  const paragraph = (value: string) => ({
    nodeType: BLOCKS.PARAGRAPH,
    data: {},
    content: [{ nodeType: "text", value, marks: [], data: {} }],
  });
  const embed = (id: string) => ({ nodeType: BLOCKS.EMBEDDED_ENTRY, data: { target: { sys: { id } } }, content: [] });
  const doc = (content: unknown[], entries: unknown[]) =>
    ({
      json: { nodeType: "document", data: {}, content },
      links: { entries: { block: entries } },
    }) as unknown as ContentfulRichText;

  it("renders a linked BlogSteps entry with each step's rich-text body", () => {
    const content = doc(
      [embed("steps-1")],
      [
        {
          __typename: "BlogSteps",
          sys: { id: "steps-1" },
          title: "Event loop",
          stepsCollection: {
            items: [
              { sys: { id: "s1" }, title: "Call stack", body: { json: { nodeType: "document", data: {}, content: [paragraph("Runs sync code.")] } } },
              null,
              { sys: { id: "s2" }, title: "Microtasks", body: null },
            ],
          },
        },
      ],
    );
    render(<>{renderContentfulRichText(content)}</>);

    expect(screen.getByRole("region", { name: "Event loop" })).toBeInTheDocument();
    expect(screen.getByText("Runs sync code.")).toBeVisible();
    expect(screen.getByText("Event loop 1 / 2")).toBeInTheDocument();
  });

  it("skips unknown or unresolved entries", () => {
    const content = doc([embed("other"), embed("missing")], [{ __typename: "SomethingElse", sys: { id: "other" } }]);
    const { container } = render(<>{renderContentfulRichText(content)}</>);
    expect(container).toBeEmptyDOMElement();
  });
});
