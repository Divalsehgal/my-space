import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AuthorBio from "./index";
import { AUTHOR } from "@/lib/config/site";

describe("AuthorBio", () => {
  it("renders author name, photo and bio", () => {
    render(<AuthorBio />);
    expect(screen.getByRole("link", { name: AUTHOR.name })).toHaveAttribute("href", "/#about");
    expect(screen.getByAltText(AUTHOR.name)).toBeInTheDocument();
    expect(screen.getByText(/building fast, accessible web apps/)).toBeInTheDocument();
  });
});
