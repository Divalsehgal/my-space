import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import CommandPalette from "./index";
import { siteIndexFixture as index } from "@/test-utils/siteIndex";

function setup() {
  const onRun = jest.fn();
  const onClose = jest.fn();
  render(<CommandPalette index={index} onRun={onRun} onClose={onClose} />);
  return { onRun, onClose, input: screen.getByRole("combobox") };
}

describe("CommandPalette", () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn(); // not implemented in jsdom
  });

  it("lists grouped items with the first one active", () => {
    const { input } = setup();
    expect(input).toHaveFocus();
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getByText("Posts")).toBeInTheDocument();
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(input).toHaveAttribute("aria-activedescendant", options[0].id);
  });

  it("filters by query and shows an empty state", () => {
    const { input } = setup();
    fireEvent.change(input, { target: { value: "hello" } });
    expect(screen.getAllByRole("option")[0]).toHaveTextContent("Hello World");
    fireEvent.change(input, { target: { value: "zzzzqqq" } });
    expect(screen.getByText("No results for “zzzzqqq”.")).toBeInTheDocument();
    expect(input).not.toHaveAttribute("aria-activedescendant");
  });

  it("moves with arrow keys (wrapping) and runs with Enter", () => {
    const { input, onRun } = setup();
    fireEvent.keyDown(input, { key: "ArrowUp" });
    const options = screen.getAllByRole("option");
    expect(options.at(-1)).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onRun).toHaveBeenCalledWith(expect.objectContaining({ id: "a-ask" }));
    fireEvent.keyDown(input, { key: "x" });
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it("does nothing on Enter or arrows with no results", () => {
    const { input, onRun } = setup();
    fireEvent.change(input, { target: { value: "zzzzqqq" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onRun).not.toHaveBeenCalled();
  });

  it("runs items by click, hover-highlight and keyboard", () => {
    const { onRun } = setup();
    const option = screen.getByText("Hello World").closest("[role=option]") as HTMLElement;
    fireEvent.mouseMove(option);
    expect(option).toHaveAttribute("aria-selected", "true");
    fireEvent.click(option);
    fireEvent.keyDown(option, { key: "Enter" });
    fireEvent.keyDown(option, { key: " " });
    fireEvent.keyDown(option, { key: "a" });
    expect(onRun).toHaveBeenCalledTimes(3);
  });

  it("closes from the backdrop", () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole("button", { name: "close" }));
    expect(onClose).toHaveBeenCalled();
  });
});
