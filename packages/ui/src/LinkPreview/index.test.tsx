import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import LinkPreview from "./index";

// jsdom has no ResizeObserver; Radix uses it to position the preview.
globalThis.ResizeObserver ??= class {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
} as unknown as typeof ResizeObserver;

function renderPreview() {
  render(
    <LinkPreview src="https://shots.example/app.png" alt="Preview of App" label="app.example">
      <a href="https://app.example">Live demo</a>
    </LinkPreview>,
  );
  return screen.getByRole("link", { name: "Live demo" });
}

describe("LinkPreview", () => {
  it("does not request the screenshot until it opens", () => {
    renderPreview();
    expect(screen.queryByAltText("Preview of App")).not.toBeInTheDocument();
  });

  it("shows the screenshot and address label on keyboard focus", async () => {
    const link = renderPreview();
    await act(() => {
      fireEvent.focus(link);
    });
    expect(await screen.findByAltText("Preview of App")).toHaveAttribute("src", "https://shots.example/app.png");
    expect(screen.getAllByText("app.example").length).toBeGreaterThan(0);
  });

  it("falls back to the label when the screenshot fails to load", async () => {
    const link = renderPreview();
    await act(() => {
      fireEvent.focus(link);
    });
    fireEvent.error(await screen.findByAltText("Preview of App"));
    expect(screen.queryByAltText("Preview of App")).not.toBeInTheDocument();
  });
});
