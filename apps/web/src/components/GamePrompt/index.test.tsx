import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import GamePrompt from "./index";
import { lockScroll, unlockScroll } from "@/lib/scroll";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";

jest.mock("@/components/StackGame", () => function MockStackGame() { return <div data-testid="stack-game" />; });
jest.mock("@/lib/scroll", () => ({ lockScroll: jest.fn(), unlockScroll: jest.fn() }));
jest.mock("@/utils/analytics", () => {
  const actual = jest.requireActual("@/utils/analytics");
  return { ...actual, trackInteraction: jest.fn() };
});

describe("GamePrompt", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows only the Play button, never an automatic pop-up", () => {
    jest.useFakeTimers();
    render(<GamePrompt items={["React"]} />);
    jest.advanceTimersByTime(60000);
    expect(screen.getByRole("button", { name: "Play the stack game" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it("opens the game from the Play button and closes with Escape", () => {
    render(<GamePrompt items={["React"]} />);
    fireEvent.click(screen.getByRole("button", { name: "Play the stack game" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("stack-game")).toBeInTheDocument();
    expect(lockScroll).toHaveBeenCalled();
    expect(trackInteraction).toHaveBeenCalledWith(ANALYTICS_EVENTS.GAME_PROMPT, { action: "play" });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(unlockScroll).toHaveBeenCalled();
  });

  it("closes from the close button", () => {
    render(<GamePrompt items={["React"]} />);
    fireEvent.click(screen.getByRole("button", { name: "Play the stack game" }));
    fireEvent.click(screen.getByRole("button", { name: "Close game" }));
    expect(unlockScroll).toHaveBeenCalled();
  });
});
