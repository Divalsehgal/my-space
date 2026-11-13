import { render } from "@testing-library/react";
import GoogleTracking from ".";
import { isOwnerMode } from "@/utils/ownerMode";

jest.mock("@/utils/ownerMode", () => ({ isOwnerMode: jest.fn() }));
jest.mock("next/script", () => function MockScript({ id, src, children }: { id?: string; src?: string; children?: string }) {
  return <script data-id={id} data-src={src}>{children}</script>;
});

const scripts = (container: HTMLElement) => [...container.querySelectorAll("script")];

describe("GoogleTracking", () => {
  beforeEach(() => (isOwnerMode as jest.Mock).mockReturnValue(false));

  it("renders nothing for the owner", () => {
    (isOwnerMode as jest.Mock).mockReturnValue(true);
    const { container } = render(<GoogleTracking gaId="G-1" gtmId="GTM-1" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("loads GA, Ads and GTM", () => {
    const { container } = render(<GoogleTracking gaId="G-1" adsId="AW-99" gtmId="GTM-1" />);
    const [lib, ga, gtm] = scripts(container);
    expect(lib.dataset.src).toContain("id=G-1");
    expect(ga.textContent).toContain("gtag('config', 'G-1'");
    expect(ga.textContent).toContain("AW-99");
    expect(gtm.textContent).toContain("GTM-1");
  });

  it("loads Ads alone with a bare id and skips an invalid GTM id", () => {
    const { container } = render(<GoogleTracking adsId="99" gtmId="UA-1" />);
    const all = scripts(container);
    expect(all).toHaveLength(2);
    expect(all[0].dataset.src).toContain("id=99");
    expect(all[1].textContent).not.toContain("gtag('config', 'G-");
    expect(all[1].textContent).toContain("AW-99");
  });

  it("renders nothing without ids", () => {
    const { container } = render(<GoogleTracking />);
    expect(container).toBeEmptyDOMElement();
  });
});
