/** @jest-environment node */
import { renderToStaticMarkup } from "react-dom/server";
import RootLayout, { generateMetadata, viewport } from "./layout";
import { portfolioService, PortfolioConfigSchema } from "@/features/portfolio";
import { getContentfulPostTitles } from "@/lib/services/contentful";
import { getT } from "@/i18n/server";

jest.mock("@dival-sehgal/fonts/next", () => ({ StackHans: { variable: "font-body" } }));
jest.mock("@/lib/fonts", () => ({ displayFont: { variable: "font-display" } }));
jest.mock("@/i18n/server", () => ({ getT: jest.fn() }));
jest.mock("@/features/portfolio", () => ({ ...jest.requireActual("@/features/portfolio"), portfolioService: { getConfig: jest.fn() } }));
jest.mock("@/lib/services/contentful", () => ({ getContentfulPostTitles: jest.fn() }));
jest.mock("next/script", () => jest.requireActual("@/test-utils/server").stub("Script"));
jest.mock("@/components/SiteIndex", () => ({ SiteIndexProvider: jest.requireActual("@/test-utils/server").stub("SiteIndex").default }));
jest.mock("@/components/Navbar", () => jest.requireActual("@/test-utils/server").stub("Navbar"));
jest.mock("@/components/ViewTransition", () => jest.requireActual("@/test-utils/server").stub("ViewTransition"));
jest.mock("@/components/Providers", () => jest.requireActual("@/test-utils/server").stub("Providers"));
jest.mock("@/components/CommandCenter", () => jest.requireActual("@/test-utils/server").stub("CommandCenter"));
jest.mock("@/components/ClickTracker", () => jest.requireActual("@/test-utils/server").stub("ClickTracker"));
jest.mock("@/components/Spotlight", () => jest.requireActual("@/test-utils/server").stub("Spotlight"));
jest.mock("@/components/GamePrompt", () => jest.requireActual("@/test-utils/server").stub("GamePrompt"));
jest.mock("@/components/Footer", () => jest.requireActual("@/test-utils/server").stub("Footer"));
jest.mock("@/components/ScrollToTop", () => jest.requireActual("@/test-utils/server").stub("ScrollToTop"));
jest.mock("@/components/GoogleTracking", () => jest.requireActual("@/test-utils/server").stub("GoogleTracking"));
jest.mock("@/components/GTMNoScript", () => jest.requireActual("@/test-utils/server").stub("GTMNoScript"));

const translate = (overrides: Record<string, string>) => (key: string) => overrides[key] ?? key;

describe("RootLayout", () => {
  it("renders the shell around children and the modal slot", async () => {
    (getT as jest.Mock).mockReturnValue(translate({}));
    (portfolioService.getConfig as jest.Mock).mockResolvedValue({ config: PortfolioConfigSchema.parse({ contact: { email: "a@b.co" } }) });
    (getContentfulPostTitles as jest.Mock).mockResolvedValue(null);
    const html = renderToStaticMarkup(await RootLayout({ children: <p>page</p>, modal: <p>modal</p> }));
    expect(html).toContain('<main id="main-content"><p>page</p></main>');
    expect(html).toContain("<p>modal</p>");
    expect(html).toContain("font-body font-display");
    expect(html).toContain("a@b.co");
  });

  it("keeps a short description and trims a long one at a word", () => {
    (getT as jest.Mock).mockReturnValue(translate({ "meta.description": "Short.", "meta.keywords": "a, b,," }));
    expect(generateMetadata()).toMatchObject({ description: "Short.", keywords: ["a", "b"] });
    (getT as jest.Mock).mockReturnValue(translate({ "meta.description": "word ".repeat(60), "meta.keywords": "" }));
    const { description } = generateMetadata();
    expect(String(description).length).toBeLessThanOrEqual(159);
    expect(String(description).endsWith("…")).toBe(true);
  });

  it("themes the browser chrome per colour scheme", () => {
    expect(viewport.themeColor).toHaveLength(2);
  });
});
