
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Toaster } from "./index";

describe("Toaster Component", () => {
  it("renders the message when open is true", () => {
    render(<Toaster open={true} message="Test Message" severity="success" onClose={jest.fn()} />);
    expect(screen.getByText("Test Message")).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(<Toaster open={false} message="Test Message" severity="success" onClose={jest.fn()} />);
    expect(screen.queryByText("Test Message")).not.toBeInTheDocument();
  });

  it("calls onClose when the alert close button is clicked", () => {
    const mockOnClose = jest.fn();
    render(<Toaster open={true} message="Test Message" severity="error" onClose={mockOnClose} />);
    
    // MUI Alert close button usually has a title or aria-label of "Close"
    const closeButton = screen.getByLabelText(/close/i);
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
