import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Tooltip from "./index";

// jsdom has no ResizeObserver; Radix uses it to position the tooltip.
globalThis.ResizeObserver ??= class {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
} as unknown as typeof ResizeObserver;

describe("Tooltip", () => {
  it("shows its text when the trigger receives keyboard focus", async () => {
    render(
      <Tooltip title="Copy code">
        <button type="button">copy</button>
      </Tooltip>,
    );
    await act(() => {
      fireEvent.focus(screen.getByRole("button", { name: "copy" }));
    });
    expect((await screen.findAllByText("Copy code")).length).toBeGreaterThan(0);
  });
});
