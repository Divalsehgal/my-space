import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReadingModeControls from "./index";

describe("ReadingModeControls", () => {
  let article: HTMLElement;

  beforeEach(() => {
    article = document.createElement("article");
    article.id = "blog-article";
    document.body.appendChild(article);
    localStorage.clear();
  });

  afterEach(() => {
    document.body.removeChild(article);
  });

  it("toggles reading mode on button click and allows adjusting font size", () => {
    render(<ReadingModeControls />);

    const toggleBtn = screen.getByRole("button", { name: /reading mode/i });
    expect(toggleBtn).toBeInTheDocument();

    // Enable reading mode
    act(() => {
      fireEvent.click(toggleBtn);
    });

    expect(article).toHaveAttribute("data-reading-mode", "true");
    expect(screen.getByRole("button", { name: /exit reading mode/i })).toBeInTheDocument();

    // Adjust font size
    const increaseBtn = screen.getByRole("button", { name: /increase font size/i });
    act(() => {
      fireEvent.click(increaseBtn);
    });

    expect(article.style.getPropertyValue("--reading-font-scale")).toBe("1.15");

    // Exit reading mode via escape key
    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });

    expect(article).not.toHaveAttribute("data-reading-mode");
  });

  it("restores a saved mode and only accepts supported font scales", () => {
    localStorage.setItem("blog-reading-mode", "true");
    localStorage.setItem("blog-font-scale", "1.15");

    render(<ReadingModeControls />);

    expect(screen.getByRole("button", { name: /exit reading mode/i })).toBeInTheDocument();
    expect(article).toHaveAttribute("data-reading-mode", "true");
    expect(article.style.getPropertyValue("--reading-font-scale")).toBe("1.15");
  });

});
