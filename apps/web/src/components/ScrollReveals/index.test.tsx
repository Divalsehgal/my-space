import { render } from "@testing-library/react";
import { animate, inView } from "framer-motion";
import { motionAllowed } from "@/lib/motion";
import ScrollReveals from "./index";

jest.mock("framer-motion", () => ({ animate: jest.fn(), inView: jest.fn(() => jest.fn()) }));
jest.mock("@/lib/motion", () => ({ EASE_OUT_EXPO: [0, 0, 1, 1], motionAllowed: jest.fn(() => true) }));

const rect = (top: number) => ({ top, bottom: top + 100, left: 0, right: 100, width: 100, height: 100, x: 0, y: top, toJSON: () => ({}) });

function setup() {
  document.body.innerHTML = `
    <div data-reveal id="visible"></div>
    <div data-reveal id="below"></div>
    <h2 data-split id="heading-below"></h2>
  `;
  const byId = (id: string) => document.getElementById(id) as HTMLElement;
  byId("visible").getBoundingClientRect = () => rect(100) as DOMRect;
  byId("below").getBoundingClientRect = () => rect(window.innerHeight + 400) as DOMRect;
  byId("heading-below").getBoundingClientRect = () => rect(window.innerHeight + 200) as DOMRect;
  return byId;
}

describe("ScrollReveals", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = jest.fn();
  });

  it("never hides content already in the viewport", () => {
    const byId = setup();
    render(<ScrollReveals />);

    expect(byId("visible").style.opacity).toBe("");
    expect(byId("below").style.opacity).toBe("0");
    expect(byId("below").style.transform).toBe("translateY(24px)");
    expect(byId("heading-below").style.opacity).toBe("0");
    expect(inView).toHaveBeenCalledTimes(2);
  });

  it("animates in when an element scrolls into view normally", () => {
    const byId = setup();
    render(<ScrollReveals />);

    const call = (inView as jest.Mock).mock.calls.find(([el]) => el === byId("below"));
    call[1]();
    expect(animate).toHaveBeenCalledWith(
      byId("below"),
      expect.objectContaining({ opacity: [0, 1] }),
      expect.objectContaining({ duration: 0.6 }),
    );
  });

  it("shows elements instantly after a large scroll jump", () => {
    const byId = setup();
    render(<ScrollReveals />);

    Object.defineProperty(window, "scrollY", { value: window.innerHeight * 3, configurable: true });
    window.dispatchEvent(new Event("scroll"));

    const call = (inView as jest.Mock).mock.calls.find(([el]) => el === byId("below"));
    call[1]();
    expect(animate).not.toHaveBeenCalled();
    expect(byId("below").style.opacity).toBe("");
    expect(byId("below").style.transform).toBe("");

    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  });

  it("leaves everything visible when motion is not allowed", () => {
    (motionAllowed as jest.Mock).mockReturnValueOnce(false);
    const byId = setup();
    render(<ScrollReveals />);

    expect(byId("below").style.opacity).toBe("");
    expect(inView).not.toHaveBeenCalled();
  });
});
