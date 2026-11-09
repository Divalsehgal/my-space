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
