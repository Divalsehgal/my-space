import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import LazyArchitectureDiagram from "./index";

jest.mock("next/dynamic", () => (load: () => Promise<unknown>, options: { loading: () => unknown }) => {
  void load();
  options.loading();
  return function MockDiagram({ nodes }: { nodes: unknown[] }) {
    return <div data-testid="diagram">{nodes.length} nodes</div>;
  };
});
jest.mock("../ArchitectureDiagram", () => ({ __esModule: true, default: () => null }));

type Callback = (entries: Array<{ isIntersecting: boolean }>) => void;

const props = { nodes: [], edges: [] };

function mockMedia(matches: boolean) {
  window.matchMedia = jest.fn().mockReturnValue({ matches }) as unknown as typeof window.matchMedia;
}

describe("LazyArchitectureDiagram", () => {
  const original = global.IntersectionObserver;
  let callback: Callback;
  const disconnect = jest.fn();

  beforeEach(() => {
    disconnect.mockClear();
    (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
      constructor(cb: Callback) {
        callback = cb;
      }
      observe = jest.fn();
      disconnect = disconnect;
    };
  });

  afterEach(() => {
    global.IntersectionObserver = original;
  });

  it("loads the diagram once the section comes near the viewport", () => {
    mockMedia(true);
    render(<LazyArchitectureDiagram {...props} />);
    expect(screen.queryByTestId("diagram")).not.toBeInTheDocument();
    act(() => callback([{ isIntersecting: false }]));
    expect(screen.queryByTestId("diagram")).not.toBeInTheDocument();
    act(() => callback([{ isIntersecting: true }]));
    expect(screen.getByTestId("diagram")).toBeInTheDocument();
    expect(disconnect).toHaveBeenCalled();
  });

  it("never loads it on phones", () => {
    mockMedia(false);
    render(<LazyArchitectureDiagram {...props} />);
    expect(screen.queryByTestId("diagram")).not.toBeInTheDocument();
  });

  it("loads immediately without IntersectionObserver", () => {
    mockMedia(true);
    (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver = undefined;
    render(<LazyArchitectureDiagram {...props} />);
    expect(screen.getByTestId("diagram")).toBeInTheDocument();
  });
});
