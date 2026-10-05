import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import Skeleton from "./index";
import Spinner from "../Spinner";

describe("loading placeholders", () => {
  it("renders a sized, decorative skeleton", () => {
    const { container } = render(<Skeleton variant="circular" width={40} height={40} />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el.style.width).toBe("40px");
  });

  it("renders an announced spinner", () => {
    const { getByRole } = render(<Spinner aria-label="Loading view count" size={14} />);
    expect(getByRole("progressbar", { name: "Loading view count" })).toBeInTheDocument();
  });
});
