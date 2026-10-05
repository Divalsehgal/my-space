import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import HeroAbout from "./index";

const paragraphs = ["Recently I've been building things.", "Outside of work, I hike."];

describe("HeroAbout", () => {
  afterEach(() => window.history.replaceState(null, "", "/"));

  it("starts folded with the bio inside", () => {
    render(<HeroAbout summary="About Me" paragraphs={paragraphs} />);
    const details = screen.getByText("About Me").closest("details");
    expect(details).toHaveAttribute("id", "about");
    expect(details).not.toHaveAttribute("open");
    expect(screen.getByText("Outside of work, I hike.")).toBeInTheDocument();
  });

  it("opens when the page loads on #about", () => {
    window.history.replaceState(null, "", "/#about");
    render(<HeroAbout summary="About Me" paragraphs={paragraphs} />);
    expect(screen.getByText("About Me").closest("details")).toHaveAttribute("open");
  });

  it("opens when a link to #about is clicked", () => {
    render(
      <>
        <a href="#about">Author</a>
        <HeroAbout summary="About Me" paragraphs={paragraphs} />
      </>,
    );
    fireEvent.click(screen.getByText("Author"));
    expect(screen.getByText("About Me").closest("details")).toHaveAttribute("open");
  });

  it("renders nothing without a bio", () => {
    const { container } = render(<HeroAbout summary="About Me" paragraphs={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
