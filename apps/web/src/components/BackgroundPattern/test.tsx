
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import BackgroundPattern from "./index";

// Mock framer-motion hooks
jest.mock("framer-motion", () => {
  const actualFramerMotion = jest.requireActual("framer-motion");
  return {
    ...actualFramerMotion,
    useScroll: () => ({ scrollY: 0 }),
    useTransform: () => 0,
    motion: {
      div: ({ style, className }: { style?: React.CSSProperties; className?: string }) => (
        <div data-testid="motion-div" style={style} className={className} />
      ),
    },
  };
});

describe("BackgroundPattern Component", () => {
  it("renders correctly with motion.div and styles", () => {
    const { getByTestId } = render(<BackgroundPattern />);
    
    const motionDiv = getByTestId("motion-div");
    
    expect(motionDiv).toBeInTheDocument();
    expect(motionDiv).toHaveClass("section__bg-pattern");
    
    // Check initial inline styles
    expect(motionDiv).toHaveStyle({ height: "120%", top: "-10%" });
  });
});
