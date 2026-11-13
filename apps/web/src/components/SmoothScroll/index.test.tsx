import { render } from "@testing-library/react";
import SmoothScroll from ".";
import Lenis from "lenis";
import { motionAllowed } from "@/lib/motion";
import { registerLenis } from "@/lib/scroll";

const destroy = jest.fn();
jest.mock("lenis", () => jest.fn(() => ({ destroy })));
jest.mock("@/lib/motion", () => ({ motionAllowed: jest.fn() }));
jest.mock("@/lib/scroll", () => ({ registerLenis: jest.fn() }));

describe("SmoothScroll", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does nothing for reduced motion", () => {
    (motionAllowed as jest.Mock).mockReturnValue(false);
    render(<SmoothScroll />);
    expect(Lenis).not.toHaveBeenCalled();
  });

  it("registers Lenis and tears it down", () => {
    (motionAllowed as jest.Mock).mockReturnValue(true);
    const { unmount } = render(<SmoothScroll />);
    expect(registerLenis).toHaveBeenCalledWith(expect.objectContaining({ destroy }));
    unmount();
    expect(registerLenis).toHaveBeenLastCalledWith(null);
    expect(destroy).toHaveBeenCalled();
  });
});
