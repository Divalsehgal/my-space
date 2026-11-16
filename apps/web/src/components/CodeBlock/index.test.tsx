import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CodeBlock } from ".";

describe("CodeBlock", () => {
  const writeText = jest.fn();
  beforeEach(() => {
    jest.useFakeTimers();
    Object.assign(navigator, { clipboard: { writeText } });
  });
  afterEach(() => jest.useRealTimers());

  it("copies the content and resets the copied state", async () => {
    writeText.mockResolvedValue(undefined);
    const { container } = render(<CodeBlock content="npm i">npm i</CodeBlock>);
    expect(screen.getByText("npm i", { selector: "code" })).toBeInTheDocument();
    const button = screen.getByRole("button");
    await act(async () => fireEvent.click(button));
    expect(writeText).toHaveBeenCalledWith("npm i");
    expect(button.className).toContain("copied");
    act(() => jest.advanceTimersByTime(2000));
    expect(button.className).not.toContain("copied");
    expect(container.querySelector("pre")).toBeInTheDocument();
  });

  it("logs when the clipboard rejects", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
    writeText.mockRejectedValue(new Error("denied"));
    render(<CodeBlock content="x">x</CodeBlock>);
    await act(async () => fireEvent.click(screen.getByRole("button")));
    expect(error).toHaveBeenCalledWith("Failed to copy text: ", expect.any(Error));
  });

  it("preserves trailing whitespace and newlines in displayed and copied code", async () => {
    writeText.mockResolvedValue(undefined);
    const content = "const a = 1;\n\n   ";
    const { container } = render(<CodeBlock content={content}>{content}</CodeBlock>);
    expect(container.querySelector("code")?.textContent).toBe(content);
    await act(async () => fireEvent.click(screen.getByRole("button")));
    expect(writeText).toHaveBeenCalledWith(content);
  });
});
