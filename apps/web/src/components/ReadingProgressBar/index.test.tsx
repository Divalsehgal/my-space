import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReadingProgressBar from "./index";

describe("ReadingProgressBar", () => {
  it("scales the fill to the share of the article read", () => {
    const article = document.createElement("article");
    article.id = "blog-article";
    let top = 0;
    Object.defineProperty(article, "getBoundingClientRect", { value: () => ({ top, height: 1000 + window.innerHeight }) });
    document.body.appendChild(article);
    const raf = jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 1;
    });

    render(<ReadingProgressBar targetId="blog-article" />);
    const bar = screen.getByRole("progressbar");
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.style.transform).toBe("scaleX(0)");

    top = -250;
    act(() => {
      fireEvent.scroll(window);
    });

    expect(fill.style.transform).toBe("scaleX(0.25)");
    expect(bar).toHaveAttribute("aria-valuenow", "25");
    raf.mockRestore();
    article.remove();
  });
});
