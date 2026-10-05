import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import CommandCenter from "./index";
import { SiteIndexProvider } from "@/components/SiteIndex";
import { ThemeContextProvider } from "@/context/ThemeContext";
import { emitSiteEvent, SITE_EVENTS } from "@/lib/site-events";
import { siteIndexFixture as index } from "@/test-utils/siteIndex";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

// Load the overlays synchronously, picking the module from the loader's source.
jest.mock("next/dynamic", () => (load: () => Promise<unknown>) => {
  void load();
  return load.toString().includes("Terminal")
    ? jest.requireActual("@/components/Terminal").default
    : jest.requireActual("@/components/CommandPalette").default;
});

function renderCenter(withIndex = true) {
  const ui = <CommandCenter />;
  return render(
    <ThemeContextProvider>{withIndex ? <SiteIndexProvider index={index}>{ui}</SiteIndexProvider> : ui}</ThemeContextProvider>,
  );
}

const palette = () => screen.queryByRole("dialog", { name: "Command palette" });
const terminal = () => screen.queryByRole("dialog", { name: "Portfolio terminal" });

function runItem(label: string) {
  fireEvent.keyDown(window, { key: "k", metaKey: true });
  fireEvent.click(screen.getByText(label));
}

describe("CommandCenter", () => {
  beforeAll(() => {
    Element.prototype.scrollTo = jest.fn();
    Element.prototype.scrollIntoView = jest.fn();
  });

  beforeEach(() => push.mockClear());

  afterEach(() => {
    document.documentElement.style.overflow = "";
  });

  it("toggles the palette with ⌘K / Ctrl+K and locks scrolling", () => {
    renderCenter();
    expect(palette()).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "K", ctrlKey: true });
    expect(palette()).toBeInTheDocument();
    expect(document.documentElement.style.overflow).toBe("hidden");
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(palette()).not.toBeInTheDocument();
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("toggles the terminal with ` outside text fields, and closes on Escape", () => {
    renderCenter();
    fireEvent.keyDown(window, { key: "`" });
    expect(terminal()).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(terminal()).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "`" });
    fireEvent.keyDown(window, { key: "`" });
    expect(terminal()).not.toBeInTheDocument();

    const field = document.createElement("input");
    document.body.appendChild(field);
    fireEvent.keyDown(field, { key: "`" });
    expect(terminal()).not.toBeInTheDocument();
    field.remove();
  });

  it("opens from site events", () => {
    renderCenter();
    act(() => emitSiteEvent(SITE_EVENTS.openPalette));
    expect(palette()).toBeInTheDocument();
    act(() => emitSiteEvent(SITE_EVENTS.openTerminal));
    expect(terminal()).toBeInTheDocument();
  });

  it("renders nothing without a site index", () => {
    const { container } = renderCenter(false);
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(container).toBeEmptyDOMElement();
  });

  it("runs palette actions", () => {
    const open = jest.spyOn(window, "open").mockImplementation(() => null);
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const game = jest.fn();
    const chat = jest.fn();
    window.addEventListener(SITE_EVENTS.openGame, game);
    window.addEventListener(SITE_EVENTS.openChat, chat);
    renderCenter();

    runItem("Blog");
    expect(push).toHaveBeenCalledWith("/blogs");
    expect(palette()).not.toBeInTheDocument();
    runItem("Open resume");
    expect(open).toHaveBeenCalledWith("https://example.com/cv.pdf", "_blank", "noopener,noreferrer");
    runItem("Toggle dark / light theme");
    expect(document.documentElement.dataset.theme).toBe("dark");
    runItem("Copy email address");
    expect(writeText).toHaveBeenCalledWith("hi@example.com");
    runItem("Play Build the Stack");
    expect(game).toHaveBeenCalled();
    runItem("Ask about Dival");
    expect(chat).toHaveBeenCalled();
    runItem("Open terminal");
    expect(terminal()).toBeInTheDocument();

    open.mockRestore();
    window.removeEventListener(SITE_EVENTS.openGame, game);
    window.removeEventListener(SITE_EVENTS.openChat, chat);
  });

  it("preloads the overlays when idle, or after a delay without requestIdleCallback", () => {
    const requestIdleCallback = jest.fn((cb: () => void) => {
      cb();
      return 7;
    });
    const cancelIdleCallback = jest.fn();
    Object.assign(window, { requestIdleCallback, cancelIdleCallback });
    const { unmount } = renderCenter();
    expect(requestIdleCallback).toHaveBeenCalled();
    unmount();
    expect(cancelIdleCallback).toHaveBeenCalledWith(7);

    Object.assign(window, { requestIdleCallback: undefined });
    jest.useFakeTimers();
    const timeout = jest.spyOn(globalThis, "setTimeout");
    const second = renderCenter();
    expect(timeout).toHaveBeenCalledWith(expect.any(Function), 2500);
    jest.runOnlyPendingTimers();
    second.unmount();
    timeout.mockRestore();
    jest.useRealTimers();
  });
});
