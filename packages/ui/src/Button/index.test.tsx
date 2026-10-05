import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Button from "./index";

describe("Button", () => {
  it("renders a type=button <button> by default", () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalled();
  });

  it("renders a link when given an href, keeping link attributes", () => {
    render(
      <Button href="/cv.pdf" target="_blank" rel="noopener noreferrer" startIcon={<span data-testid="icon" />}>
        Resume
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Resume" });
    expect(link).toHaveAttribute("href", "/cv.pdf");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("supports submit and disabled states", () => {
    render(
      <Button type="submit" disabled fullWidth>
        Send
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Send" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toBeDisabled();
  });

  it("shows a spinner, sets aria-busy and blocks clicks while loading", () => {
    const onClick = jest.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole("button", { name: /Save/ });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    // The busy state is announced by the button (aria-busy); the spinner is decorative.
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
