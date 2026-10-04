import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SocialDock from "./index";

describe("SocialDock", () => {
  it("renders the social links in a labelled nav", () => {
    render(<SocialDock socialItems={[{ label: "GitHub", href: "https://github.com/x", icon: "github" }]} />);
    expect(screen.getByRole("navigation", { name: "Socials" })).toBeInTheDocument();
    expect(screen.getByLabelText("GitHub")).toHaveAttribute("href", "https://github.com/x");
  });

  it("renders nothing without socials", () => {
    const { container } = render(<SocialDock socialItems={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
