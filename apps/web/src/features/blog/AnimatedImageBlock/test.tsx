import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AnimatedImageBlock from "./index";

beforeAll(() => {
  class MockIntersectionObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  }
  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
});

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    onLoad,
    onError,
    className,
  }: {
    src: string;
    alt: string;
    onLoad?: () => void;
    onError?: () => void;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      data-testid="next-image"
      onLoad={onLoad}
      onError={onError}
    />
  ),
}));

describe("AnimatedImageBlock", () => {
  const asset = {
    url: "https://images.ctfassets.net/sample.png",
    title: "Sample diagram",
    width: 800,
    height: 450,
  };

  it("renders loader initially and hides it after image loads", () => {
    render(<AnimatedImageBlock asset={asset} />);

    const loader = screen.getByTestId("image-loader");
    expect(loader).toBeInTheDocument();

    const img = screen.getByTestId("next-image");
    expect(img).toHaveAttribute("alt", "Sample diagram");

    // Simulate image loading
    fireEvent.load(img);
    expect(loader.className).toContain("shimmerHidden");
  });

  it("renders caption when asset title is provided", () => {
    render(<AnimatedImageBlock asset={asset} />);
    expect(screen.getByText("Sample diagram")).toBeInTheDocument();
  });

  it("opens and closes lightbox modal on click and close button", async () => {
    render(<AnimatedImageBlock asset={asset} />);

    const img = screen.getByTestId("next-image");
    fireEvent.load(img);

    const trigger = screen.getByRole("button", { name: /view sample diagram in full screen/i });
    fireEvent.click(trigger);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Click close button
    const closeBtn = screen.getByRole("button", { name: /close full view/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("handles image error state gracefully", () => {
    render(<AnimatedImageBlock asset={asset} />);

    const img = screen.getByTestId("next-image");
    fireEvent.error(img);

    expect(img).toHaveAttribute("src", "/placeholder-project.jpg");
  });
});
