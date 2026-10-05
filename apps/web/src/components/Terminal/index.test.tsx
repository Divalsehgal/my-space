import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Terminal from "./index";
import { ThemeContextProvider } from "@/context/ThemeContext";
import { SITE_EVENTS } from "@/lib/site-events";
import { siteIndexFixture as index } from "@/test-utils/siteIndex";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function setup() {
  const onClose = jest.fn();
  render(
    <ThemeContextProvider>
      <Terminal index={index} onClose={onClose} />
    </ThemeContextProvider>,
  );
  const input = screen.getByRole("textbox", { name: "Command" });
  const run = (command: string) => {
    fireEvent.change(input, { target: { value: command } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);
  };
  return { onClose, input, run };
}

describe("Terminal", () => {
  beforeAll(() => {
    Element.prototype.scrollTo = jest.fn(); // not implemented in jsdom
  });

  beforeEach(() => {
    push.mockClear();
    delete document.documentElement.dataset.theme;
  });

  it("greets the visitor, focuses the input and shows the prompt", () => {
    const { input } = setup();
    expect(screen.getByRole("dialog", { name: "Portfolio terminal" })).toBeInTheDocument();
    expect(screen.getByText(/Dival Sehgal — portfolio shell/)).toBeInTheDocument();
    expect(screen.getByText("visitor@dival: ~")).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it("echoes commands with their output", () => {
    const { run } = setup();
    run("whoami");
    expect(screen.getByText("$ whoami")).toBeInTheDocument();
    expect(screen.getByText("Dival Sehgal, Software Engineer.")).toBeInTheDocument();
  });

  it("navigates and closes for cd", () => {
    const { run, onClose } = setup();
    run("cd projects");
    expect(push).toHaveBeenCalledWith("/#projects");
    expect(onClose).toHaveBeenCalled();
  });

  it("opens external links in a new tab", () => {
    const open = jest.spyOn(window, "open").mockImplementation(() => null);
    const { run, onClose } = setup();
    run("open github");
    expect(open).toHaveBeenCalledWith("https://github.com/x", "_blank", "noopener,noreferrer");
    expect(onClose).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it("switches theme only when needed", () => {
    const { run } = setup();
    run("theme light");
    expect(document.documentElement.dataset.theme).toBe("light");
    run("theme dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    run("theme");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("copies the email, ignoring clipboard failures", () => {
    const writeText = jest.fn().mockRejectedValue(new Error("denied"));
    Object.assign(navigator, { clipboard: { writeText } });
    const { run } = setup();
    run("email");
    expect(writeText).toHaveBeenCalledWith("hi@example.com");
  });

  it("launches the game, hands questions to chat and exits", () => {
    const game = jest.fn();
    const chat = jest.fn();
    window.addEventListener(SITE_EVENTS.openGame, game);
    window.addEventListener(SITE_EVENTS.openChat, chat);
    const { run, onClose } = setup();

    run("game");
    expect(game).toHaveBeenCalled();
    run("ask what stack?");
    expect((chat.mock.calls[0][0] as CustomEvent).detail).toEqual({ message: "what stack?" });
    expect(screen.getByText(/Handing your question/)).toBeInTheDocument();
    run("exit");
    expect(onClose).toHaveBeenCalledTimes(3);

    window.removeEventListener(SITE_EVENTS.openGame, game);
    window.removeEventListener(SITE_EVENTS.openChat, chat);
  });

  it("clears the screen with clear and Ctrl+L", () => {
    const { run, input } = setup();
    run("whoami");
    run("clear");
    expect(screen.queryByText("$ whoami")).not.toBeInTheDocument();

    run("whoami");
    fireEvent.keyDown(input, { key: "l" });
    expect(screen.getByText("$ whoami")).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "l", ctrlKey: true });
    expect(screen.queryByText("$ whoami")).not.toBeInTheDocument();
  });

  it("tab-completes and walks command history", () => {
    const { run, input } = setup();
    fireEvent.change(input, { target: { value: "who" } });
    fireEvent.keyDown(input, { key: "Tab" });
    expect(input).toHaveValue("whoami ");

    run("whoami");
    run("   ");
    run("about");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue("about");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue("whoami");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue("whoami");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveValue("");
  });

  it("closes from the close button and refocuses on screen click", () => {
    const { onClose, input } = setup();
    input.blur();
    fireEvent.click(screen.getByRole("log"));
    expect(input).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Close terminal" }));
    expect(onClose).toHaveBeenCalled();
  });
});
