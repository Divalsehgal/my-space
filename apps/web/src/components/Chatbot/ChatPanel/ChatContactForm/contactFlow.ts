import type { createContactSchema } from "@/types/contact";

export type ContactField = "name" | "email" | "message";
export type ContactValues = Record<ContactField, string>;
export type ContactStep = ContactField | "review" | "sending" | "sent" | "failed" | "cancelled";

/** Asked one at a time, in this order. */
export const CONTACT_FIELDS: readonly ContactField[] = ["name", "email", "message"];

export interface ContactFlowState {
  step: ContactStep;
  values: ContactValues;
  /** Validation error for the current field, or the submit error when failed. */
  error?: string;
  /** Answering a field returns to the summary instead of the next field. */
  editing: boolean;
}

export type ContactFlowAction =
  | { type: "answer"; value: string; error?: string }
  | { type: "edit"; field: ContactField }
  | { type: "submit" }
  | { type: "sent" }
  | { type: "failed"; error: string; field?: ContactField }
  | { type: "cancel" };

// Whole words only, so "contactless", "hired" or "collaborated on" don't open the form.
const CONTACT_INTENT = [
  /\b(contact|get in touch|reach out|hire|collaborat(e|ion))\b/i,
  /\b(work (together|with (you|him|dival))|email (him|dival))\b/i,
  /\bsend (him |dival )?(a )?(message|note|email)\b/i,
];

/** True when the visitor wants to get in touch, hire or collaborate. */
export function isContactIntent(text: string): boolean {
  return CONTACT_INTENT.some((pattern) => pattern.test(text));
}

/** The schema's message for one field, or undefined when the value is valid. */
export function fieldError(schema: ReturnType<typeof createContactSchema>, field: ContactField, value: string): string | undefined {
  const result = schema.shape[field].safeParse(value.trim());
  return result.success ? undefined : result.error.issues[0]?.message;
}

export function initialContactFlow(prefill?: Partial<ContactValues> | null): ContactFlowState {
  return { step: "name", values: { name: "", email: "", message: "", ...prefill }, editing: false };
}

// Which steps each action applies in; anything else is ignored (double clicks, stale callbacks).
const ALLOWED: Record<ContactFlowAction["type"], readonly ContactStep[]> = {
  answer: CONTACT_FIELDS,
  edit: ["review", "failed"],
  submit: ["review", "failed"],
  sent: ["sending"],
  failed: ["sending"],
  cancel: [...CONTACT_FIELDS, "review", "failed"],
};

export function contactFlowReducer(state: ContactFlowState, action: ContactFlowAction): ContactFlowState {
  if (!ALLOWED[action.type].includes(state.step)) {
    return state;
  }
  switch (action.type) {
    case "answer": {
      if (action.error) {
        return { ...state, error: action.error };
      }
      const field = state.step as ContactField;
      const next = state.editing ? "review" : (CONTACT_FIELDS[CONTACT_FIELDS.indexOf(field) + 1] ?? "review");
      return { ...state, step: next, values: { ...state.values, [field]: action.value.trim() }, error: undefined, editing: false };
    }
    case "edit":
      return { ...state, step: action.field, error: undefined, editing: true };
    case "submit":
      return { ...state, step: "sending", error: undefined };
    case "sent":
      return { ...state, step: "sent" };
    case "failed":
      // A field the server rejected goes straight back to that field.
      return action.field ? { ...state, step: action.field, error: action.error, editing: true } : { ...state, step: "failed", error: action.error };
    case "cancel":
      return { ...state, step: "cancelled", error: undefined };
    default:
      return state;
  }
}
