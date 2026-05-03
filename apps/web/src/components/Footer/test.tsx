
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Footer from "./index";

jest.mock("next/link", () => {
  return function MockLink({ children, href }: any) {
    return (
      <a href={href} data-testid={`link-${href}`}>
        {children}
      </a>
    );
  };
});

describe("Footer Component", () => {
  it("renders the default brand when no brand prop is provided", () => {
    render(<Footer />);
    // Brand appears in link and copyright
    const brandTexts = screen.getAllByText("Dival Sehgal");
    expect(brandTexts.length).toBeGreaterThan(0);
  });

  it("renders the custom brand prop", () => {
    render(<Footer brand="Test Brand" />);
    const brandTexts = screen.getAllByText("Test Brand");
    expect(brandTexts.length).toBeGreaterThan(0);
  });

  it("renders the current year in the copyright section", () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<Footer />);
    const homeLink = screen.getByTestId("link-/#home");
    expect(homeLink).toBeInTheDocument();
    
    const projectsLink = screen.getByTestId("link-/#projects");
    expect(projectsLink).toBeInTheDocument();
  });

  it("renders social links", () => {
    render(<Footer />);
    const githubLink = screen.getByLabelText("GitHub");
    expect(githubLink).toHaveAttribute("href", "https://github.com");
    
    const linkedinLink = screen.getByLabelText("LinkedIn");
    expect(linkedinLink).toHaveAttribute("href", "https://linkedin.com");
  });
});
