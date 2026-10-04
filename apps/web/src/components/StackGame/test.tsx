import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import StackGame from "./index";
import type { StackGameApi } from "./Scene";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";

jest.mock("@/utils/analytics", () => {
  const actual = jest.requireActual("@/utils/analytics");
  return { ...actual, trackInteraction: jest.fn() };
});

// Replace the WebGL scene with a stub that exposes the game callbacks.
const gameApi: StackGameApi = { drop: jest.fn(), reset: jest.fn() };
let callbacks: { onPlaced: (h: number, p: boolean) => void; onGameOver: (h: number) => void };
jest.mock("next/dynamic", () => () =>
  function MockScene(props: {
    onReady: (api: StackGameApi) => void;
    onPlaced: (h: number, p: boolean) => void;
    onGameOver: (h: number) => void;
  }) {
    props.onReady(gameApi);
    callbacks = props;
    return <div data-testid="scene" />;
  },
);

// jsdom has no PointerEvent; MouseEvent carries the clientX/Y the game reads.
if (typeof window.PointerEvent === "undefined") {
  (window as unknown as { PointerEvent: typeof MouseEvent }).PointerEvent = MouseEvent;
}

const tap = (el: HTMLElement, dx = 0) => {
  fireEvent.pointerDown(el, { clientX: 10, clientY: 10 });
  fireEvent.pointerUp(el, { clientX: 10 + dx, clientY: 10 });
};

describe("StackGame", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("shows the start panel before playing", () => {
    render(<StackGame items={["React"]} />);
    expect(screen.getByText("Build the stack")).toBeInTheDocument();
    expect(screen.getByText("Tap to play")).toBeInTheDocument();
  });

  it("starts on tap, then drops a block on the next tap", () => {
    render(<StackGame items={["React"]} />);
    const game = screen.getByRole("application");
    tap(game);
    expect(gameApi.reset).toHaveBeenCalled();
    expect(trackInteraction).toHaveBeenCalledWith(ANALYTICS_EVENTS.GAME_START, { attempt: 1 });
    tap(game);
    expect(gameApi.drop).toHaveBeenCalledTimes(1);
  });

  it("ignores swipes so the page can scroll", () => {
    render(<StackGame items={["React"]} />);
    tap(screen.getByRole("application"), 40);
    expect(gameApi.reset).not.toHaveBeenCalled();
  });

  it("supports the keyboard", () => {
    render(<StackGame items={["React"]} />);
    const game = screen.getByRole("application");
    fireEvent.keyDown(game, { key: " " });
    fireEvent.keyDown(game, { key: "Enter" });
    expect(gameApi.reset).toHaveBeenCalled();
    expect(gameApi.drop).toHaveBeenCalled();
  });

  it("labels placed blocks with stack items and records the best score", () => {
    render(<StackGame items={["React", "GraphQL"]} />);
    tap(screen.getByRole("application"));
    act(() => callbacks.onPlaced(1, false));
    expect(screen.getByText("+ React")).toBeInTheDocument();
    act(() => callbacks.onPlaced(2, true));
    expect(screen.getByText("Perfect · GraphQL")).toBeInTheDocument();
    act(() => callbacks.onGameOver(2));
    expect(screen.getByText("2 blocks")).toBeInTheDocument();
    expect(screen.getByText("New best.")).toBeInTheDocument();
    expect(localStorage.getItem("stack-game-best")).toBe("2");
    expect(trackInteraction).toHaveBeenCalledWith(ANALYTICS_EVENTS.GAME_OVER, { score: 2, best: 2 });
  });
});
