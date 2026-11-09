import { contactSchema } from "@/types/contact";
import { contactFlowReducer, fieldError, initialContactFlow, isContactIntent, type ContactFlowState } from "./contactFlow";

const filled: ContactFlowState = {
  step: "review",
  values: { name: "Ada", email: "ada@example.com", message: "Hello" },
  editing: false,
};

describe("isContactIntent", () => {
  it.each([
    "I want to get in touch",
    "How can I contact him?",
    "Send a message to Dival",
    "I'd like to hire Dival",
    "Can we collaborate?",
    "I'd love to work together",
    "email him please",
  ])("matches %p", (text) => expect(isContactIntent(text)).toBe(true));

  it.each([
    "Tell me about Dival",
    "Which projects has he collaborated on?",
    "Was he hired at Google?",
    "Does he work with React?",
    "contactless payments",
  ])("ignores %p", (text) => expect(isContactIntent(text)).toBe(false));
});

describe("fieldError", () => {
  it("returns the schema message for invalid values and nothing for valid ones", () => {
    expect(fieldError(contactSchema, "name", "   ")).toBe("Name is required");
    expect(fieldError(contactSchema, "email", "not-an-email")).toBe("Please enter a valid email address");
    expect(fieldError(contactSchema, "email", " ada@example.com ")).toBeUndefined();
    expect(fieldError(contactSchema, "message", "x".repeat(1001))).toMatch(/cannot exceed 1000/);
  });
});

describe("contactFlowReducer", () => {
  it("asks name, email, message in order, then shows the summary", () => {
    let state = initialContactFlow();
    state = contactFlowReducer(state, { type: "answer", value: " Ada " });
    expect(state.step).toBe("email");
    state = contactFlowReducer(state, { type: "answer", value: "ada@example.com" });
    expect(state.step).toBe("message");
    state = contactFlowReducer(state, { type: "answer", value: "Hello" });
    expect(state).toEqual(filled);
  });

  it("stays on the field with the error when the answer is invalid", () => {
    const state = contactFlowReducer(initialContactFlow(), { type: "answer", value: "", error: "Name is required" });
    expect(state.step).toBe("name");
    expect(state.error).toBe("Name is required");
  });

  it("prefills remembered values", () => {
    expect(initialContactFlow({ name: "Ada", email: "ada@example.com" }).values).toEqual({ name: "Ada", email: "ada@example.com", message: "" });
  });

  it("edits one field from the summary and returns to the summary", () => {
    let state = contactFlowReducer(filled, { type: "edit", field: "email" });
    expect(state).toMatchObject({ step: "email", editing: true });
    state = contactFlowReducer(state, { type: "answer", value: "ada@new.dev" });
    expect(state).toMatchObject({ step: "review", editing: false, values: { email: "ada@new.dev" } });
  });

  it("submits, then succeeds", () => {
    const sending = contactFlowReducer(filled, { type: "submit" });
    expect(sending.step).toBe("sending");
    expect(contactFlowReducer(sending, { type: "sent" }).step).toBe("sent");
  });

  it("fails with a retry that submits again", () => {
    const failed = contactFlowReducer(contactFlowReducer(filled, { type: "submit" }), { type: "failed", error: "Boom" });
    expect(failed).toMatchObject({ step: "failed", error: "Boom" });
    expect(contactFlowReducer(failed, { type: "submit" })).toMatchObject({ step: "sending", error: undefined });
  });

  it("sends a server field error back to that field", () => {
    const state = contactFlowReducer(contactFlowReducer(filled, { type: "submit" }), { type: "failed", error: "Bad email", field: "email" });
    expect(state).toMatchObject({ step: "email", error: "Bad email", editing: true });
  });

  it("ignores actions that don't fit the current step", () => {
    const sending = contactFlowReducer(filled, { type: "submit" });
    expect(contactFlowReducer(sending, { type: "submit" })).toBe(sending);
    expect(contactFlowReducer(sending, { type: "cancel" })).toBe(sending);
    expect(contactFlowReducer(sending, { type: "edit", field: "name" })).toBe(sending);
    expect(contactFlowReducer(filled, { type: "answer", value: "x" })).toBe(filled);
    expect(contactFlowReducer(initialContactFlow(), { type: "sent" }).step).toBe("name");
  });

  it("cancels before sending", () => {
    expect(contactFlowReducer(initialContactFlow(), { type: "cancel" }).step).toBe("cancelled");
  });
});
