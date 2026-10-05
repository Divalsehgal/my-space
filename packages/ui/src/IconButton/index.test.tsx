import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import IconButton from "./index";

describe("IconButton", () => {
  it("is a named button", () => {
    const onClick = jest.fn();
    render(
      <IconButton aria-label="Close" onClick={onClick}>
        x
      </IconButton>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClick).toHaveBeenCalled();
  });

  it("becomes a link with an href", () => {
    render(
      <IconButton aria-label="GitHub" href="https://github.com" target="_blank" size="large">
        g
      </IconButton>,
    );
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com");
  });
});
