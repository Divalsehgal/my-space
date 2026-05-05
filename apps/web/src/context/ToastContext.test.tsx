
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ToastProvider, useToast } from "./ToastContext";

import { type AlertColor } from "@mui/material";


// Mock the Toaster presentation component
jest.mock("@/components/Toaster", () => ({
  Toaster: ({ open, message, severity, onClose }: { open: boolean; message: string; severity: AlertColor; onClose: (event?: React.SyntheticEvent | Event | null, reason?: string) => void }) => {
    if (!open) {return null;}
    return (
      <div data-testid="mock-toaster" data-severity={severity}>
        {message}
        <button data-testid="close-btn" onClick={() => onClose()}>Close</button>
        <button data-testid="clickaway-btn" onClick={() => onClose(null, "clickaway")}>Clickaway</button>
      </div>
    );
  },
}));

const TestComponent = ({ msg, severity }: { msg?: string, severity?: AlertColor }) => {
  const { showToast } = useToast();
  return (
    <button onClick={() => showToast(msg || "Test Message", severity)}>
      Trigger Toast
    </button>
  );
};

describe("ToastContext", () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it("throws an error if useToast is used outside of ToastProvider", () => {
    expect(() => render(<TestComponent />)).toThrow(
      "useToast must be used within a ToastProvider"
    );
  });

  it("shows the toast with correct message and severity when triggered", () => {
    render(
      <ToastProvider>
        <TestComponent msg="Error Message" severity="error" />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText("Trigger Toast"));
    });

    const toaster = screen.getByTestId("mock-toaster");
    expect(toaster).toHaveTextContent("Error Message");
    expect(toaster).toHaveAttribute("data-severity", "error");
  });

  it("uses default severity 'success' when not provided", () => {
    render(
      <ToastProvider>
        <TestComponent msg="Success Message" />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText("Trigger Toast"));
    });

    const toaster = screen.getByTestId("mock-toaster");
    expect(toaster).toHaveTextContent("Success Message");
    expect(toaster).toHaveAttribute("data-severity", "success");
  });

  it("closes the toast when handleClose is called", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText("Trigger Toast"));
    });

    expect(screen.getByTestId("mock-toaster")).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByTestId("close-btn"));
    });

    expect(screen.queryByTestId("mock-toaster")).not.toBeInTheDocument();
  });

  it("does not close the toast if reason is clickaway", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText("Trigger Toast"));
    });

    act(() => {
      fireEvent.click(screen.getByTestId("clickaway-btn"));
    });

    expect(screen.getByTestId("mock-toaster")).toBeInTheDocument();
  });
});
