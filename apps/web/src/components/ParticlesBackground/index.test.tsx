import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ParticlesBackground from ".";
import { ThemeContextProvider } from "@/context/ThemeContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const mockInit = jest.fn(async (cb: (engine: unknown) => Promise<void>) => cb({}));
const mockLoadSlim = jest.fn();
jest.mock("@tsparticles/react", () => ({ initParticlesEngine: (cb: never) => mockInit(cb) }));
jest.mock("@tsparticles/slim", () => ({ loadSlim: (e: unknown) => mockLoadSlim(e) }));
jest.mock("next/dynamic", () => () => function MockParticles({ id, options, className }: { id: string; options: { particles: { number: { value: number } } }; className?: string }) {
  return <canvas data-testid="particles" id={id} className={className} data-count={options.particles.number.value} />;
});
jest.mock("@/hooks/useMediaQuery", () => ({ useMediaQuery: jest.fn(() => false) }));

const renderParticles = async (props = {}) => {
  const utils = render(<ThemeContextProvider><ParticlesBackground {...props} /></ThemeContextProvider>);
  await act(async () => undefined);
  return utils;
};

describe("ParticlesBackground", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    Object.defineProperty(navigator, "connection", { value: undefined, configurable: true });
  });

  it("loads the engine and renders the canvas", async () => {
    await renderParticles({ id: "stars", count: 10, className: "c" });
    const canvas = screen.getByTestId("particles");
    expect(canvas).toHaveAttribute("id", "stars");
    expect(canvas).toHaveAttribute("data-count", "10");
    expect(mockLoadSlim).toHaveBeenCalled();
  });

  it("generates an id when none is given", async () => {
    await renderParticles({ fullScreen: false, interactive: false });
    expect(screen.getByTestId("particles").id).toMatch(/^particles-/);
  });

  it("still renders when the engine fails to load", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockInit.mockRejectedValueOnce(new Error("no canvas"));
    await renderParticles();
    expect(screen.getByTestId("particles")).toBeInTheDocument();
  });

  it("skips the effect for reduced motion and Save-Data", async () => {
    (useMediaQuery as jest.Mock).mockReturnValue(true);
    await renderParticles();
    expect(screen.queryByTestId("particles")).not.toBeInTheDocument();
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    Object.defineProperty(navigator, "connection", { value: { saveData: true }, configurable: true });
    await renderParticles();
    expect(mockInit).not.toHaveBeenCalled();
  });
});
