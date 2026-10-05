import { submitContact } from "./index";
import { createContactSubmission } from "../../lib/services/notion";

jest.mock("../../lib/services/notion", () => ({
  createContactSubmission: jest.fn(),
}));

const submit = createContactSubmission as jest.Mock;

function form(fields: Record<string, string | Blob>) {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.append(key, value));
  return data;
}

describe("submitContact", () => {
  beforeEach(() => {
    submit.mockReset();
  });

  it("returns field errors for invalid input without submitting", async () => {
    const result = await submitContact({ status: "idle" }, form({ name: "", email: "nope", message: "" }));
    expect(result.status).toBe("error");
    expect(result.message).toBe("Almost there — check the highlighted fields.");
    expect(Object.keys(result.errors ?? {})).toEqual(expect.arrayContaining(["name", "email", "message"]));
    expect(submit).not.toHaveBeenCalled();
  });

  it("treats missing fields and file uploads as empty", async () => {
    const result = await submitContact({ status: "idle" }, form({ name: new Blob(["x"]) }));
    expect(result.status).toBe("error");
    expect(result.errors?.name).toBeDefined();
  });

  it("submits trimmed fields and reports success", async () => {
    submit.mockResolvedValue(undefined);
    const result = await submitContact(
      { status: "idle" },
      form({ name: " Ann ", email: " ann@example.com ", message: " Hello " }),
    );
    expect(submit).toHaveBeenCalledWith({ name: "Ann", email: "ann@example.com", message: "Hello" });
    expect(result).toEqual({ status: "success", message: "Thanks for reaching out! I'll get back to you soon." });
  });

  it("reports a failure when the service throws", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
    submit.mockRejectedValue(new Error("down"));
    const result = await submitContact({ status: "idle" }, form({ name: "Ann", email: "ann@example.com", message: "Hi" }));
    expect(result).toEqual({ status: "error", message: "Something went wrong. Please try again in a moment." });
    error.mockRestore();
  });
});
