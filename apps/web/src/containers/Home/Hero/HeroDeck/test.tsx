import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import HeroDeck from "./index";

jest.mock("next/link", () =>
  function MockLink({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  },
);

const props = {
  latestPost: { slug: "inside-every-api-call", title: "Inside Every API Call", relativeLabel: "Published 3 weeks ago" },
  currentRole: { role: "Senior Software Engineer", company: "EPAM Systems" },
  skills: ["React", "Next.js", "TypeScript", "Node.js", "GraphQL", "Python", "AWS"],
};

describe("HeroDeck", () => {
  // The interactive stacked deck is the tablet-and-up layout.
  beforeAll(() => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query.includes("min-width"),
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })) as unknown as typeof window.matchMedia;
  });

  it("leads with the portrait", () => {
    const { container } = render(<HeroDeck {...props} />);
    const front = container.querySelector(".deck__card--front");
    expect(front).toContainElement(screen.getByAltText("Portrait of Dival Sehgal"));
  });

  it("shows the latest post, current role and top skills", () => {
    render(<HeroDeck {...props} />);
    expect(screen.getByText("Inside Every API Call")).toBeInTheDocument();
    expect(screen.getAllByText(/Published/)).toHaveLength(1);
    expect(screen.getByText(/Read it/).closest("a")).toHaveAttribute("href", "/blogs/inside-every-api-call");
    expect(screen.getByText("EPAM Systems")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.queryByText("AWS")).not.toBeInTheDocument(); // top six only
  });

  it("falls back to the blog index without a latest post", () => {
    render(<HeroDeck skills={[]} />);
    expect(screen.getByText(/Browse the blog/).closest("a")).toHaveAttribute("href", "/blogs");
  });

  it("brings a clicked card to the front", () => {
    const { container } = render(<HeroDeck {...props} />);
    fireEvent.click(screen.getByText("EPAM Systems").closest("div") as HTMLElement);
    expect(container.querySelector(".deck__card--front")).toHaveTextContent("EPAM Systems");
  });
});
