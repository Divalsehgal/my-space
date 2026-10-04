import { fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import HomeTopBar from "./index";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";
import { renderWithTracking } from "@/test-utils/render";

jest.mock("@/components/ParticlesBackground", () => function MockParticles() { return null; });
jest.mock("@/utils/analytics", () => {
  const actual = jest.requireActual("@/utils/analytics");
  return { ...actual, trackInteraction: jest.fn() };
});

const post = { slug: "inside-every-api-call", title: "Inside Every API Call", relativeLabel: "Published 3 weeks ago" };

describe("HomeTopBar", () => {
  it("renders nothing without a latest post", () => {
    const { container } = renderWithTracking(<HomeTopBar latestPost={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("links only the post title, not the whole bar", () => {
    renderWithTracking(<HomeTopBar latestPost={post} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/blogs/inside-every-api-call");
    expect(link).toHaveTextContent("Inside Every API Call");
    expect(link).not.toHaveTextContent("New Blog");
    expect(link).not.toHaveTextContent("3 weeks ago");
  });

  it("tracks clicks on the post link", () => {
    renderWithTracking(<HomeTopBar latestPost={post} />);
    fireEvent.click(screen.getByRole("link"));
    expect(trackInteraction).toHaveBeenCalledWith(ANALYTICS_EVENTS.NAV_CLICK, {
      label: "Inside Every API Call",
      href: "/blogs/inside-every-api-call",
      location: "home-top-bar",
    });
  });
});
