import { render, screen } from "@testing-library/react";
import NotFoundComponent from "./index";

describe("NotFound component", () => {
  it("renders heading and recovery action", () => {
    render(<NotFoundComponent />);

    expect(
      screen.getByRole("heading", { name: /lost in space\?/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/page you're searching for seems to have vanished/i)
    ).toBeInTheDocument();

    const homeLink = screen.getByRole("link", { name: /return to home/i });
    expect(homeLink).toHaveAttribute("href", "/");
  });
});
