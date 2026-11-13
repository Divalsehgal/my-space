import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import HeroStage from ".";
import { animate, scroll } from "framer-motion";
import { motionAllowed } from "@/lib/motion";

const cleanup = jest.fn();
jest.mock("framer-motion", () => ({ animate: jest.fn(() => "anim"), scroll: jest.fn(() => cleanup) }));
jest.mock("@/lib/motion", () => ({ motionAllowed: jest.fn() }));

describe("HeroStage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("only renders children for reduced motion", () => {
    (motionAllowed as jest.Mock).mockReturnValue(false);
    render(<HeroStage className="c">copy</HeroStage>);
    expect(screen.getByText("copy")).toHaveClass("c");
    expect(scroll).not.toHaveBeenCalled();
  });

  it("scrubs the lift to the enclosing section", () => {
    (motionAllowed as jest.Mock).mockReturnValue(true);
    const { unmount, container } = render(<section><HeroStage>copy</HeroStage></section>);
    expect(animate).toHaveBeenCalled();
    expect(scroll).toHaveBeenCalledWith("anim", expect.objectContaining({ target: container.querySelector("section") }));
    unmount();
    expect(cleanup).toHaveBeenCalled();
  });

  it("falls back to itself when there is no section", () => {
    (motionAllowed as jest.Mock).mockReturnValue(true);
    render(<HeroStage>copy</HeroStage>);
    expect((scroll as jest.Mock).mock.calls[0][1].target).toBe(screen.getByText("copy"));
  });
});
