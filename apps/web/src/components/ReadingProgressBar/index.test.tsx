import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReadingProgressBar from "./index";

describe("ReadingProgressBar", () => {
  it("renders a progressbar and updates on scroll", () => {
    const article = document.createElement("article");
    article.id = "blog-article";
    Object.defineProperty(article, "getBoundingClientRect", {
      value: () => ({ top: -200, height: 1000 }),
    });
    document.body.appendChild(article);

    render(<ReadingProgressBar targetId="blog-article" />);

    const bar = screen.getByRole("progressbar");
    expect(bar).toBeInTheDocument();

    act(() => {
      fireEvent.scroll(window);
    });

    expect(bar).toHaveAttribute("aria-valuenow");
    document.body.removeChild(article);
  });
});
