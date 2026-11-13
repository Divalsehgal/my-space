import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { submitContact } from "@/actions/submit-contact";
import ChatContactForm from "./index";

jest.mock("@/actions/submit-contact", () => ({ submitContact: jest.fn() }));
jest.mock("@/utils/analytics", () => ({ ...jest.requireActual("@/utils/analytics"), trackInteraction: jest.fn() }));
jest.mock("@/utils/contactRemember", () => ({ getRememberedContact: jest.fn(() => null), saveRememberedContact: jest.fn() }));

function answer(label: RegExp, value: string) {
  const input = screen.getByLabelText(label);
  fireEvent.change(input, { target: { value } });
  fireEvent.submit(input.closest("form")!);
}

describe("ChatContactForm", () => {
  afterEach(() => jest.clearAllMocks());

  it("asks each field with its own empty input, then submits through the contact action", async () => {
    jest.mocked(submitContact).mockResolvedValue({ status: "success", message: "Thanks!" });
    render(<ChatContactForm />);

    expect(screen.getByLabelText(/your name/i)).toHaveFocus();
    answer(/your name/i, "Ada");
    expect(screen.getByLabelText(/which email/i)).toHaveValue("");
    answer(/which email/i, "nope");
    expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
    answer(/which email/i, "ada@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Job opportunity" }));
    fireEvent.submit(screen.getByLabelText(/like to say/i).closest("form")!);

    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await waitFor(() => expect(screen.getByText("Thanks for reaching out! I'll get back to you soon.")).toBeInTheDocument());
    const formData = jest.mocked(submitContact).mock.calls[0][1];
    expect(Object.fromEntries(formData)).toEqual({ name: "Ada", email: "ada@example.com", message: expect.stringContaining("job opportunity") });
  });

  it("shows the error with a retry after a failed submit", async () => {
    jest.mocked(submitContact).mockResolvedValueOnce({ status: "error", message: "Down" }).mockResolvedValueOnce({ status: "success" });
    render(<ChatContactForm />);
    answer(/your name/i, "Ada");
    answer(/which email/i, "ada@example.com");
    answer(/like to say/i, "Hi");

    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Down");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(submitContact).toHaveBeenCalledTimes(2));
  });
});

describe("ChatContactForm flows", () => {
  afterEach(() => jest.clearAllMocks());

  const reachReview = () => {
    render(<ChatContactForm />);
    answer(/your name/i, "Ada");
    answer(/which email/i, "ada@example.com");
    answer(/like to say/i, "Hi");
  };

  it("cancels from a question", () => {
    render(<ChatContactForm />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.getByRole("status")).not.toHaveTextContent("Thanks");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("cancels from the review", () => {
    reachReview();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("button", { name: "Send message" })).not.toBeInTheDocument();
  });

  it("moves on with Ctrl/Cmd+Enter, not plain Enter", () => {
    const requestSubmit = jest.fn();
    HTMLFormElement.prototype.requestSubmit = requestSubmit;
    render(<ChatContactForm />);
    const input = screen.getByLabelText(/your name/i);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(requestSubmit).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter", metaKey: true });
    fireEvent.keyDown(input, { key: "Enter", ctrlKey: true });
    expect(requestSubmit).toHaveBeenCalledTimes(2);
  });

  it("edits one answer from the review", () => {
    reachReview();
    fireEvent.click(screen.getByRole("button", { name: /edit name/i }));
    expect(screen.getByLabelText(/your name/i)).toHaveValue("Ada");
  });

  it("returns a rejected field with the server's message", async () => {
    jest.mocked(submitContact).mockResolvedValue({ status: "error", message: "Nope", errors: { email: ["Email bounced"] } });
    reachReview();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    // Sent back to the rejected question, with the answer kept for fixing.
    expect(await screen.findByLabelText(/which email/i)).toHaveValue("ada@example.com");
  });

  it("falls back to a generic error when the action throws or says nothing", async () => {
    jest.mocked(submitContact).mockRejectedValueOnce(new Error("net")).mockResolvedValueOnce({ status: "error" } as never);
    reachReview();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    const first = (await screen.findByRole("alert")).textContent;
    expect(first).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(submitContact).toHaveBeenCalledTimes(2));
    expect((await screen.findByRole("alert")).textContent).toBe(first);
  });
});
