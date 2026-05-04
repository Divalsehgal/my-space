
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PortfolioProvider, usePortfolioContext } from "./PortfolioContext";
import { type PortfolioConfig } from "@/features/portfolio";

const TestComponent = () => {
  const context = usePortfolioContext();
  return <div data-testid="context-val">{context?.hero?.title}</div>;
};

describe("PortfolioContext", () => {
  it("provides the value to children via usePortfolioContext", () => {
    const mockValue = {
      hero: { title: "Portfolio Context Working" },
    } as unknown as PortfolioConfig;

    render(
      <PortfolioProvider value={mockValue}>
        <TestComponent />
      </PortfolioProvider>
    );

    expect(screen.getByTestId("context-val")).toHaveTextContent("Portfolio Context Working");
  });

  it("returns null when used outside of provider if default is null", () => {
    render(<TestComponent />);
    expect(screen.getByTestId("context-val")).toBeEmptyDOMElement();
  });
});
