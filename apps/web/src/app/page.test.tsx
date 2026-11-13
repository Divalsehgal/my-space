import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import HomePage from "./page";
import { portfolioService, PortfolioConfigSchema } from "@/features/portfolio";
import { getContentfulPosts } from "@/lib/services/contentful";
import { stubProps } from "@/test-utils/server";

jest.mock("@/features/portfolio", () => ({ ...jest.requireActual("@/features/portfolio"), portfolioService: { getConfig: jest.fn() } }));
jest.mock("@/lib/services/contentful", () => ({ getContentfulPosts: jest.fn() }));
jest.mock("@/containers/Home/Hero", () => jest.requireActual("@/test-utils/server").stub("Hero"));
jest.mock("@/containers/Home/Skills", () => jest.requireActual("@/test-utils/server").stub("Skills"));
jest.mock("@/containers/Home/Experience", () => jest.requireActual("@/test-utils/server").stub("Experience"));
jest.mock("@/containers/Home/Project", () => jest.requireActual("@/test-utils/server").stub("Project"));
jest.mock("@/containers/Home/Contact", () => jest.requireActual("@/test-utils/server").stub("Contact"));
jest.mock("@/components/ArchitectureWidget", () => jest.requireActual("@/test-utils/server").stub("ArchitectureWidget"));
jest.mock("@/components/SocialDock", () => jest.requireActual("@/test-utils/server").stub("SocialDock"));
jest.mock("@/components/JsonLd", () => jest.requireActual("@/test-utils/server").stub("JsonLd"));
jest.mock("@/components/ScrollReveals", () => jest.requireActual("@/test-utils/server").stub("ScrollReveals"));
jest.mock("@/components/SectionSnap", () => jest.requireActual("@/test-utils/server").stub("SectionSnap"));
jest.mock("@/components/HomeTopBar", () => jest.requireActual("@/test-utils/server").stub("HomeTopBar"));
jest.mock("@/components/RelatedPosts", () => jest.requireActual("@/test-utils/server").stub("RelatedPosts"));

const mockConfig = (raw: object) =>
  (portfolioService.getConfig as jest.Mock).mockResolvedValue({ config: PortfolioConfigSchema.parse(raw) });

describe("HomePage", () => {
  it("renders every section with the latest post and a full Person graph", async () => {
    mockConfig({
      contact: { email: "a@b.co" },
      experience: [{ company: "EPAM — Clients: X", role: "Engineer", period: "now", description: [] }],
      socials: [{ label: "GitHub", href: "https://github.com/x" }],
    });
    (getContentfulPosts as jest.Mock).mockResolvedValue([{ slug: "p", title: "Post", date: "2026-01-01" }]);
    render(await HomePage());
    expect(stubProps(screen.getByTestId("HomeTopBar")).latestPost).toMatchObject({ slug: "p", title: "Post" });
    expect(stubProps(screen.getByTestId("Hero")).highlights.currentRole).toEqual({ role: "Engineer", company: "EPAM — Clients: X" });
    expect(screen.getByTestId("RelatedPosts")).toBeInTheDocument();
    const person = stubProps(screen.getByTestId("JsonLd")).data["@graph"][2];
    expect(person).toMatchObject({ email: "mailto:a@b.co", worksFor: { name: "EPAM" }, sameAs: ["https://github.com/x"] });
  });

  it("omits the top bar, writing section and job without data", async () => {
    mockConfig({});
    (getContentfulPosts as jest.Mock).mockResolvedValue([]);
    render(await HomePage());
    expect(screen.queryByTestId("HomeTopBar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("RelatedPosts")).not.toBeInTheDocument();
    const person = stubProps(screen.getByTestId("JsonLd")).data["@graph"][2];
    expect(person.email).toBeUndefined();
    expect(person.worksFor).toBeUndefined();
  });
});
