import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import LivePreviewProvider from ".";
import { ContentfulLivePreviewProvider } from "@contentful/live-preview/react";

jest.mock("@contentful/live-preview/react", () => ({
  ContentfulLivePreviewProvider: jest.fn(({ children }) => <>{children}</>),
}));

describe("LivePreviewProvider", () => {
  it("wraps children with live updates on", () => {
    render(<LivePreviewProvider><p>draft</p></LivePreviewProvider>);
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect((ContentfulLivePreviewProvider as jest.Mock).mock.calls[0][0]).toMatchObject({ locale: "en-US", enableLiveUpdates: true });
  });
});
