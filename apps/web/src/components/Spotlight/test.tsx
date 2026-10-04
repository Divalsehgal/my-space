import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import SpotlightTracker from "./index";
import { paintSpotlight } from "@/lib/spotlight";

const rect = (left: number, top: number) => () => ({ left, top }) as DOMRect;

describe("paintSpotlight", () => {
  it("lights every card in a spotlight group", () => {
    document.body.innerHTML = `<div data-spotlight-group><div data-spotlight id="a"></div><div data-spotlight id="b"></div></div>`;
    const a = document.getElementById("a") as HTMLElement;
    const b = document.getElementById("b") as HTMLElement;
    a.getBoundingClientRect = rect(10, 20);
    b.getBoundingClientRect = rect(100, 20);
    paintSpotlight(a, 60, 70);
    expect(a.style.getPropertyValue("--spot-x")).toBe("50px");
    expect(b.style.getPropertyValue("--spot-x")).toBe("-40px");
  });

  it("lights only the hovered card outside a group, and ignores other targets", () => {
    document.body.innerHTML = `<div data-spotlight id="c"><span id="inner"></span></div><p id="plain"></p>`;
    const c = document.getElementById("c") as HTMLElement;
    c.getBoundingClientRect = rect(0, 0);
    paintSpotlight(document.getElementById("inner"), 5, 6);
    expect(c.style.getPropertyValue("--spot-y")).toBe("6px");
    expect(() => paintSpotlight(document.getElementById("plain"), 1, 1)).not.toThrow();
    expect(() => paintSpotlight(null, 1, 1)).not.toThrow();
  });
});

describe("SpotlightTracker", () => {
  it("renders nothing", () => {
    const { container } = render(<SpotlightTracker />);
    expect(container).toBeEmptyDOMElement();
  });
});
