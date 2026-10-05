import { render } from "@testing-library/react";
import type Lenis from "lenis";
import Snap from "lenis/snap";
import SectionSnap from "./index";
import { registerLenis } from "@/lib/scroll";

jest.mock("lenis/snap", () => jest.fn());

const SnapMock = Snap as unknown as jest.Mock;

type SnapInstance = { add: jest.Mock; destroy: jest.Mock; removers: jest.Mock[] };

function mockMedia(matches: boolean) {
  window.matchMedia = jest.fn().mockReturnValue({ matches }) as unknown as typeof window.matchMedia;
}

/** A section at `top` (document coordinates) of `height` px. */
function section(top: number, height: number) {
  const el = document.createElement("section");
  el.className = "section";
  el.getBoundingClientRect = () => ({ top, height }) as DOMRect;
  return el;
}

describe("SectionSnap", () => {
  let instances: SnapInstance[];
  let resizeCallback: () => void;
  const disconnect = jest.fn();
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    instances = [];
    frames = [];
    SnapMock.mockReset().mockImplementation(() => {
      const removers: jest.Mock[] = [];
      const instance = {
        removers,
        add: jest.fn(() => {
          const remove = jest.fn();
          removers.push(remove);
          return remove;
        }),
        destroy: jest.fn(),
      };
      instances.push(instance);
      return instance;
    });
    (global as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      constructor(cb: () => void) {
        resizeCallback = cb;
      }
      observe = jest.fn();
      disconnect = disconnect;
    };
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => frames.push(cb));
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 864 }); // 800px visible under the navbar

    const page = document.createElement("div");
    page.className = "page-scroll";
    // A short section at the top, then a tall one (2000px) and a short one.
    page.append(section(0, 600), section(600, 2000), section(2600, 600));
    document.body.replaceChildren(page);
  });

  afterEach(() => {
    registerLenis(null);
    jest.restoreAllMocks();
  });

  it("does nothing on phones", () => {
    mockMedia(false);
    render(<SectionSnap />);
    registerLenis({} as Lenis);
    expect(SnapMock).not.toHaveBeenCalled();
  });

  it("adds a stop per section plus inner stops for tall sections, merging close ones", () => {
    mockMedia(true);
    render(<SectionSnap />);
    expect(SnapMock).not.toHaveBeenCalled(); // waits for Lenis

    const lenis = {} as Lenis;
    registerLenis(lenis);
    expect(SnapMock).toHaveBeenCalledWith(lenis, expect.objectContaining({ type: "lock", distanceThreshold: "100%" }));
    const { easing } = SnapMock.mock.calls[0][1] as { easing: (t: number) => number };
    expect(easing(0)).toBe(0);
    expect(easing(1)).toBe(1);

    // Tops (minus the 64px navbar): 0, 536, 2536. The tall section steps every
    // 680px (536 → 1216) and ends at 1736; 2536's neighbours are far enough apart.
    expect(instances[0].add.mock.calls.map(([y]) => y)).toEqual([0, 536, 1216, 1736, 2536]);
  });

  it("re-places stops on resize, dropping the old ones", () => {
    mockMedia(true);
    render(<SectionSnap />);
    registerLenis({} as Lenis);
    const [snap] = instances;
    const firstBatch = [...snap.removers];

    resizeCallback();
    resizeCallback();
    expect(frames).toHaveLength(2);
    frames[1](0);
    firstBatch.forEach((remove) => expect(remove).toHaveBeenCalled());
    expect(snap.add).toHaveBeenCalledTimes(10);
  });

  it("ignores scheduled updates before Lenis exists", () => {
    mockMedia(true);
    render(<SectionSnap />);
    resizeCallback();
    frames[0](0);
    expect(SnapMock).not.toHaveBeenCalled();
  });

  it("rebuilds when Lenis changes and cleans up on unmount", () => {
    mockMedia(true);
    const { unmount } = render(<SectionSnap />);
    registerLenis({} as Lenis);
    registerLenis(null);
    expect(instances[0].destroy).toHaveBeenCalled();
    registerLenis({} as Lenis);
    const [, second] = instances;

    unmount();
    expect(second.destroy).toHaveBeenCalled();
    second.removers.forEach((remove) => expect(remove).toHaveBeenCalled());
    expect(disconnect).toHaveBeenCalled();
  });
});
