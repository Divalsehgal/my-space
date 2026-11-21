import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";
import { createQuizQuestions } from "./api/createQuizQuestions";

const mockSdk = { ids: { entry: "quiz-1", contentType: "quizComponent" }, window: { startAutoResizer: jest.fn() } };
jest.mock("@contentful/react-apps-toolkit", () => ({ useSDK: () => mockSdk }));
jest.mock("./api/createQuizQuestions", () => ({ createQuizQuestions: jest.fn() }));
// f36 pulls in emotion and a large ESM tree; plain elements are enough here.
jest.mock("@contentful/f36-components", () => ({
  Heading: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  Paragraph: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
  Button: ({ isDisabled, onClick, children }: { isDisabled: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button disabled={isDisabled} onClick={onClick}>{children}</button>
  ),
}));

const question = (text: string, explanation = "Because.") => ({
  questionText: text,
  explanation,
  options: [
    { text: "A", isCorrect: true },
    { text: "B", isCorrect: false },
    { text: "C", isCorrect: false },
    { text: "D", isCorrect: false },
  ],
});

const input = () => screen.getByLabelText("Quiz JSON input");
const setJson = (value: unknown) => fireEvent.change(input(), { target: { value: typeof value === "string" ? value : JSON.stringify(value) } });
const importButton = () => screen.getByRole("button");

describe("App", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSdk.ids = { entry: "quiz-1", contentType: "quizComponent" };
  });

  it("previews the default question and starts the auto-resizer", () => {
    render(<App />);
    expect(mockSdk.window.startAutoResizer).toHaveBeenCalled();
    expect(screen.getByText(/Import preview \(1 question\)/)).toBeInTheDocument();
    expect(screen.getByText(/Paris\s+\(correct\)/)).toBeInTheDocument();
  });

  it("pluralises the preview, flags a missing explanation and hides it for bad JSON", () => {
    render(<App />);
    setJson({ questions: [question("One"), question("Two", "")] });
    expect(screen.getByText(/2 questions/)).toBeInTheDocument();
    expect(screen.getByText("Missing explanation")).toBeInTheDocument();
    setJson({ nope: true });
    expect(screen.queryByText(/Import preview/)).not.toBeInTheDocument();
    setJson("{");
    expect(screen.queryByText(/Import preview/)).not.toBeInTheDocument();
  });

  it("imports questions and shows the server message", async () => {
    (createQuizQuestions as jest.Mock).mockResolvedValue("Done!");
    render(<App />);
    fireEvent.click(screen.getByRole("checkbox"));
    await act(async () => fireEvent.click(importButton()));
    expect(createQuizQuestions).toHaveBeenCalledWith("quiz-1", expect.objectContaining({ questions: expect.any(Array) }), false, expect.any(Function));
    expect(screen.getByText("Done!")).toBeInTheDocument();
  });

  it("falls back to a default success message", async () => {
    (createQuizQuestions as jest.Mock).mockResolvedValue(undefined);
    render(<App />);
    await act(async () => fireEvent.click(importButton()));
    expect(screen.getByText(/Created 1 question\(s\) successfully/)).toBeInTheDocument();
  });

  it("shows validation and server errors", async () => {
    render(<App />);
    setJson({ questions: [] });
    await act(async () => fireEvent.click(importButton()));
    expect(createQuizQuestions).not.toHaveBeenCalled();
    expect(document.body.textContent).toMatch(/question/i);

    setJson({ questions: [question("Q")] });
    (createQuizQuestions as jest.Mock).mockRejectedValue("weird");
    await act(async () => fireEvent.click(importButton()));
    expect(screen.getByText("Unknown error creating questions.")).toBeInTheDocument();
  });

  it("is disabled and warns outside a quiz entry", async () => {
    mockSdk.ids = { entry: "", contentType: "blogPage" };
    render(<App />);
    expect(screen.getByText(/Open this app from a/)).toBeInTheDocument();
    expect(importButton()).toBeDisabled();
  });
});
