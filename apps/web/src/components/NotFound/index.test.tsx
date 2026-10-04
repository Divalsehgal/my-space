import { render, screen } from "@testing-library/react";
import NotFoundComponent from "./index";

describe("NotFound component", () => {
  it("renders heading and recovery actions", () => {
    render(<NotFoundComponent />);

    expect(
      screen.getByRole("heading", { name: /page not found/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/this link may be old or mistyped/i)
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /go to homepage/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /read the blog/i })).toHaveAttribute("href", "/blogs");
  });
});
