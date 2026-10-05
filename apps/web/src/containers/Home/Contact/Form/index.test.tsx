import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";

import ContactForm from "./index";
import { getRememberedContact, saveRememberedContact } from "@/utils/contactRemember";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";

jest.mock("@/utils/analytics", () => {
  const actual = jest.requireActual("@/utils/analytics");
  return {
    ...actual,
    trackInteraction: jest.fn(),
  };
});

jest.mock("@/utils/contactRemember", () => ({
  getRememberedContact: jest.fn(),
  saveRememberedContact: jest.fn(),
}));

jest.mock("@/context/ToastContext", () => ({
  ToastContext: React.createContext({ showToast: jest.fn() }),
}));

let currentActionState: { status: string; message?: string; errors?: Record<string, string[]> } = {
  status: "idle",
};
let currentIsPending = false;

jest.mock("react", () => {
  const actualReact = jest.requireActual("react");
  return {
    ...actualReact,
    useActionState: jest.fn(() => [currentActionState, jest.fn(), currentIsPending]),
    use: jest.fn(() => ({ showToast: jest.fn() })),
  };
});

describe("ContactForm", () => {
  beforeEach(() => {
    currentActionState = { status: "idle" };
    currentIsPending = false;
    jest.mocked(getRememberedContact).mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("leaves name and email blank when nothing is remembered", () => {
    render(<ContactForm />);

    expect(screen.getByLabelText(/Name/i)).toHaveValue("");
    expect(screen.getByLabelText(/Email/i)).toHaveValue("");
  });

  it("pre-fills name and email when a remembered contact exists", async () => {
    jest.mocked(getRememberedContact).mockReturnValue({ name: "Ada", email: "ada@example.com" });

    render(<ContactForm />);

    // The prefill is applied inside a deferred (setTimeout) state update, so
    // it lands a tick after mount - wait for it rather than asserting sync.
    await waitFor(() => expect(screen.getByLabelText(/Name/i)).toHaveValue("Ada"));
    expect(screen.getByLabelText(/Email/i)).toHaveValue("ada@example.com");
  });

  it("saves name and email to storage on a successful submission", () => {
    const { rerender } = render(<ContactForm />);

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Grace" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "grace@example.com" } });

    currentActionState = { status: "success", message: "Sent!" };
    rerender(<ContactForm />);

    expect(saveRememberedContact).toHaveBeenCalledWith({ name: "Grace", email: "grace@example.com" });
  });

  it("does not save to storage on a failed submission", () => {
    const { rerender } = render(<ContactForm />);

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Grace" } });

    currentActionState = { status: "error", message: "Something went wrong" };
    rerender(<ContactForm />);

    expect(saveRememberedContact).not.toHaveBeenCalled();
  });

  it("fills the message field when a template is selected", () => {
    render(<ContactForm />);

    expect(screen.getByLabelText(/Message/i)).toHaveValue("");

    fireEvent.click(screen.getByRole("button", { name: "Job opportunity" }));

    expect(screen.getByLabelText(/Message/i)).not.toHaveValue("");
    expect(trackInteraction).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.CONTACT_TEMPLATE_SELECT,
      { template: "Job opportunity" },
    );
  });

  it("lets the selected template text still be edited by hand", () => {
    render(<ContactForm />);

    fireEvent.click(screen.getByRole("button", { name: "Just saying hi" }));
    fireEvent.change(screen.getByLabelText(/Message/i), { target: { value: "Edited message" } });

    expect(screen.getByLabelText(/Message/i)).toHaveValue("Edited message");
  });
});
