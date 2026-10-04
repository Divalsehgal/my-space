import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import TextField from "./index";

describe("TextField", () => {
  it("labels the input and reports changes", () => {
    const onChange = jest.fn();
    render(<TextField label="Email" name="email" type="email" value="" onChange={onChange} required />);
    const input = screen.getByLabelText(/Email/);
    expect(input).toHaveAttribute("type", "email");
    expect(input).toBeRequired();
    fireEvent.change(input, { target: { value: "a@b.co" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("links helper text and flags errors for assistive tech", () => {
    render(<TextField label="Name" name="name" value="" onChange={jest.fn()} error helperText="Name is required" />);
    const input = screen.getByLabelText(/Name/);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Name is required");
    expect(screen.getByRole("alert")).toHaveTextContent("Name is required");
  });

  it("renders a textarea when multiline", () => {
    render(<TextField label="Message" name="message" value="" onChange={jest.fn()} multiline minRows={5} maxLength={1000} />);
    const textarea = screen.getByLabelText(/Message/);
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("maxlength", "1000");
  });
});
