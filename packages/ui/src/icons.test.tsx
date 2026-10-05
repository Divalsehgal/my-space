import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as icons from "./icons";

describe("icons", () => {
  const entries = Object.entries(icons) as Array<[string, icons.IconComponent]>;

  it.each(entries)("%s renders a decorative, named svg", (name, Icon) => {
    render(<Icon />);
    const svg = screen.getByTestId(name);
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(Icon.displayName).toBe(name);
  });

  it("maps fontSize to the shared size scale and passes props through", () => {
    render(<icons.SearchIcon fontSize="small" aria-hidden={false} aria-label="Search" />);
    const svg = screen.getByLabelText("Search");
    expect(svg).toHaveAttribute("width", "1.25em");
    expect(svg).toHaveAttribute("aria-hidden", "false");
  });
});
