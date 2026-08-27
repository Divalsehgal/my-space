import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";
import About from ".";

// Mock analytics
jest.mock("@/utils/analytics", () => {
  const actual = jest.requireActual("@/utils/analytics");
  return {
    ...actual,
    trackInteraction: jest.fn(),
  };
});

// Mock decorative background
jest.mock("@/components/BackgroundPattern", () => {
  const MockBackgroundPattern = () => <div data-testid="bg-pattern" />;
  MockBackgroundPattern.displayName = "BackgroundPattern";
  return MockBackgroundPattern;
});

describe("About Container", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders defaults when props are empty", () => {
    render(<About />);
    expect(screen.getByText("About Me")).toBeInTheDocument();
    expect(screen.getByText("Socials")).toBeInTheDocument();
  });

  it("renders dynamic content from props", () => {
    const mockAbout = {
      title: "Test About",
      paragraphs: ["I am a test.", "This is a paragraph."],
      facts: ["100% Coverage", "Fast Performance"],
    };
    const mockSocials = [
      { label: "Github", href: "https://github.com", icon: "github" },
    ];

    render(<About data={mockAbout} socials={mockSocials} />);

    expect(screen.getByText("Test About")).toBeInTheDocument();
    expect(screen.getByText("I am a test.")).toBeInTheDocument();
    expect(screen.getByText("This is a paragraph.")).toBeInTheDocument();
    expect(screen.getByText("100% Coverage")).toBeInTheDocument();
    expect(screen.getByText("Fast Performance")).toBeInTheDocument();

    const githubBtn = screen.getByLabelText("Github");
    expect(githubBtn).toHaveAttribute("href", "https://github.com");
  });

  it("renders all paragraphs directly from props without mangling content", () => {
    const paragraphs = [
      "First paragraph containing details about software engineering.",
      "Second paragraph containing details about frontend and backend work.",
    ];

    render(<About data={{ title: "About", paragraphs, facts: [] }} />);

    expect(screen.getByText(paragraphs[0])).toBeInTheDocument();
    expect(screen.getByText(paragraphs[1])).toBeInTheDocument();
  });

  it("triggers trackEvent on social click", () => {
    const mockSocials = [
      { label: "Github", href: "https://github.com", icon: "github" },
    ];

    render(<About socials={mockSocials} />);

    const githubBtn = screen.getByLabelText("Github");
    fireEvent.click(githubBtn);

    expect(trackInteraction).toHaveBeenCalledWith(ANALYTICS_EVENTS.SOCIAL_CLICK, {
      platform: "Github",
      href: "https://github.com",
    });
  });

  it("uses fallback text for socials when icon is missing or unknown", () => {
    const mockSocials = [
      { label: "Twitter", href: "https://twitter.com", icon: "twitter" },
      { label: "Website", href: "https://dival.me" }, // missing icon
    ];

    render(<About socials={mockSocials} />);

    // Twitter is unknown icon -> TW
    expect(screen.getByText("TW")).toBeInTheDocument();
    // Website is missing icon -> WE
    expect(screen.getByText("WE")).toBeInTheDocument();
  });
});
