import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import About from "./index";
import { trackEvent } from "@/utils/analytics";
import { usePortfolioContext } from "@/context/PortfolioContext";

// Mock analytics
jest.mock("@/utils/analytics", () => ({
  trackEvent: jest.fn(),
}));

// Mock context
jest.mock("@/context/PortfolioContext", () => ({
  usePortfolioContext: jest.fn(),
}));

// Mock decorative background
jest.mock("@/components/BackgroundPattern", () => () => <div data-testid="bg-pattern" />);

describe("About Container", () => {
  beforeEach(() => {
    (usePortfolioContext as jest.Mock).mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders defaults when context is empty", () => {
    render(<About />);
    expect(screen.getByText("About Me")).toBeInTheDocument();
    expect(screen.getByText("Socials")).toBeInTheDocument();
  });

  it("renders dynamic content from context", () => {
    (usePortfolioContext as jest.Mock).mockReturnValue({
      about: {
        title: "Test About",
        paragraphs: ["I am a test.", "This is a paragraph."],
        facts: ["100% Coverage", "Fast Performance"],
      },
      socials: [
        { label: "Github", href: "https://github.com", icon: "github" },
      ],
    });

    render(<About />);
    
    expect(screen.getByText("Test About")).toBeInTheDocument();
    expect(screen.getByText("I am a test.")).toBeInTheDocument();
    expect(screen.getByText("This is a paragraph.")).toBeInTheDocument();
    expect(screen.getByText("100% Coverage")).toBeInTheDocument();
    expect(screen.getByText("Fast Performance")).toBeInTheDocument();
    
    const githubBtn = screen.getByLabelText("Github");
    expect(githubBtn).toHaveAttribute("href", "https://github.com");
  });

  it("triggers trackEvent on social click", () => {
    (usePortfolioContext as jest.Mock).mockReturnValue({
      socials: [
        { label: "Github", href: "https://github.com", icon: "github" },
      ],
    });

    render(<About />);
    
    const githubBtn = screen.getByLabelText("Github");
    fireEvent.click(githubBtn);
    
    expect(trackEvent).toHaveBeenCalledWith("click", "Social", { label: "Github" });
  });

  it("uses fallback text for socials when icon is missing or unknown", () => {
    (usePortfolioContext as jest.Mock).mockReturnValue({
      socials: [
        { label: "Twitter", href: "https://twitter.com", icon: "twitter" },
        { label: "Website", href: "https://dival.me" }, // missing icon
      ],
    });

    render(<About />);
    
    // Twitter is unknown icon -> TW
    expect(screen.getByText("TW")).toBeInTheDocument();
    // Website is missing icon -> WE
    expect(screen.getByText("WE")).toBeInTheDocument();
  });
});
