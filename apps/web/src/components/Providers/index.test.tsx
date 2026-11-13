import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Providers from ".";

jest.mock("next/dynamic", () => () => function MockChatbot() {
  return <div data-testid="chatbot" />;
});

describe("Providers", () => {
  it("renders children with the chatbot", () => {
    render(<Providers><p>child</p></Providers>);
    expect(screen.getByText("child")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot")).toBeInTheDocument();
  });
});
