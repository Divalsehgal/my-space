import { fireEvent, render } from "@testing-library/react";
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

  describe("with hover support", () => {
    const originalMatchMedia = window.matchMedia;
    let frames: FrameRequestCallback[];

    beforeEach(() => {
      frames = [];
      window.matchMedia = jest.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
      jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        frames.push(cb);
        return frames.length;
      });
      jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    });

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
      jest.restoreAllMocks();
    });

    it("paints the latest pointer position once per frame", () => {
      document.body.innerHTML = `<div data-spotlight id="card"></div>`;
      const card = document.getElementById("card") as HTMLElement;
      card.getBoundingClientRect = rect(0, 0);
      render(<SpotlightTracker />);
      // jsdom's PointerEvent drops clientX/Y, so dispatch a MouseEvent of that type.
      const move = (clientX: number, clientY: number) =>
        card.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX, clientY }));
      move(1, 2);
      move(3, 4);
      expect(frames).toHaveLength(1);
      expect(card.style.getPropertyValue("--spot-x")).toBe("");
      frames[0](0);
      expect(card.style.getPropertyValue("--spot-x")).toBe("3px");
      expect(card.style.getPropertyValue("--spot-y")).toBe("4px");
    });

    it("removes the listener and cancels the frame on unmount", () => {
      const { unmount } = render(<SpotlightTracker />);
      fireEvent.pointerMove(document.body);
      unmount();
      expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
    });
  });
});
