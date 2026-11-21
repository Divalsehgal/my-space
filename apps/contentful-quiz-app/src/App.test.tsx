import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";
import { createQuizQuestions } from "./api/createQuizQuestions";
import { generateQuizQuestions } from "./api/generateQuizQuestions";

type Children = { children?: React.ReactNode };

const quizField = { getValue: jest.fn(), setValue: jest.fn(() => Promise.resolve()) };
const mockSdk = {
  ids: { entry: "quiz-1", contentType: "quizComponent", app: "app-1" },
  window: { startAutoResizer: jest.fn() },
  entry: { fields: { quiz: quizField } },
  cma: { appSignedRequest: { create: jest.fn(() => Promise.resolve({ additionalHeaders: { sig: "1" } })) } },
};
jest.mock("@contentful/react-apps-toolkit", () => ({ useSDK: () => mockSdk }));
jest.mock("./api/createQuizQuestions", () => ({ createQuizQuestions: jest.fn() }));
jest.mock("./api/generateQuizQuestions", () => ({ generateQuizQuestions: jest.fn() }));
// f36 pulls in emotion and a large ESM tree; plain elements are enough here.
jest.mock("@contentful/f36-components", () => {
  const Plain = ({ children }: Children) => <div>{children}</div>;
  const Select = ({ children, ...props }: Children & React.SelectHTMLAttributes<HTMLSelectElement> & { isDisabled?: boolean }) => (
    <select aria-label={props["aria-label"]} value={props.value} onChange={props.onChange}>{children}</select>
  );
  Select.Option = ({ children, value }: Children & { value: string }) => <option value={value}>{children}</option>;
  return {
    Heading: ({ children }: Children) => <h2>{children}</h2>,
    Paragraph: ({ children }: Children) => <p>{children}</p>,
    Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
    Button: ({ isDisabled, onClick, children, ...rest }: Children & { isDisabled?: boolean; onClick: () => void; "aria-label"?: string }) => (
      <button disabled={isDisabled} onClick={onClick} aria-label={rest["aria-label"]}>{children}</button>
    ),
    Note: ({ children }: Children) => <div role="note">{children}</div>,
    Text: ({ children }: Children) => <span>{children}</span>,
    Badge: ({ children }: Children) => <span>{children}</span>,
    Spinner: () => <span>loading</span>,
    Stack: Plain,
    Card: Plain,
    Select,
  };
});

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
const importButton = () => screen.getByRole("button", { name: /^Import/ });

describe("App on a quiz entry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSdk.ids = { entry: "quiz-1", contentType: "quizComponent", app: "app-1" };
  });

  it("previews the sample question and starts the auto-resizer", () => {
    render(<App />);
    expect(mockSdk.window.startAutoResizer).toHaveBeenCalled();
    expect(screen.getByText(/Import preview \(1 question\)/)).toBeInTheDocument();
    expect(screen.getByText("correct")).toBeInTheDocument();
  });

  it("pluralises the preview, flags a missing explanation, removes a question and hides it for bad JSON", () => {
    render(<App />);
    setJson({ questions: [question("One"), question("Two", "")] });
    expect(screen.getByText(/Import preview \(2 questions\)/)).toBeInTheDocument();
    expect(screen.getByText("Missing explanation")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove question 1" }));
    expect(screen.getByText(/Import preview \(1 question\)/)).toBeInTheDocument();
    setJson("{");
    expect(screen.queryByText(/Import preview/)).not.toBeInTheDocument();
    expect(importButton()).toBeDisabled();
  });

  it("imports into the quiz and shows the server message", async () => {
    (createQuizQuestions as jest.Mock).mockResolvedValue({ message: "Done!" });
    render(<App />);
    fireEvent.click(screen.getByRole("checkbox"));
    await act(async () => fireEvent.click(importButton()));
    expect(createQuizQuestions).toHaveBeenCalledWith({ quizId: "quiz-1" }, expect.objectContaining({ questions: expect.any(Array) }), false, expect.any(Function));
    expect(screen.getByText("Done!")).toBeInTheDocument();
    expect(quizField.setValue).not.toHaveBeenCalled();
  });

  it("shows validation and server errors", async () => {
    render(<App />);
    setJson({ questions: [{ questionText: "Q" }] });
    await act(async () => fireEvent.click(importButton()));
    expect(createQuizQuestions).not.toHaveBeenCalled();
    expect(screen.getByRole("note")).toHaveTextContent(/question/i);

    setJson({ questions: [question("Q")] });
    (createQuizQuestions as jest.Mock).mockRejectedValue("weird");
    await act(async () => fireEvent.click(importButton()));
    expect(screen.getByText("Unknown error creating questions.")).toBeInTheDocument();
  });

  it("warns on other entries", () => {
    mockSdk.ids = { entry: "x", contentType: "author", app: "app-1" };
    render(<App />);
    expect(screen.getByText(/Open this app from a/)).toBeInTheDocument();
    expect(importButton()).toBeDisabled();
  });
});

describe("App on a blog post", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSdk.ids = { entry: "blog-1", contentType: "blogPage", app: "app-1" };
    quizField.getValue.mockReturnValue(undefined);
  });

  it("drafts questions into the JSON box, then imports them and links the new quiz", async () => {
    (generateQuizQuestions as jest.Mock).mockResolvedValue({
      questions: [{ ...question("Drafted?"), sourceQuote: "The post says so.", section: "Intro" }],
      dropped: 2,
      existingCount: 0,
    });
    (createQuizQuestions as jest.Mock).mockResolvedValue({ message: "Created.", quizId: "quiz-new" });
    render(<App />);
    expect(screen.getByText(/no quiz yet/)).toBeInTheDocument();
    expect(importButton()).toHaveTextContent("Import questions");

    fireEvent.change(screen.getByLabelText("Number of questions"), { target: { value: "4" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Draft from this post" })));
    expect(generateQuizQuestions).toHaveBeenCalledWith("blog-1", 4, expect.any(Function));
    expect(screen.getByText(/Drafted 1 question\(s\), 2 dropped/)).toBeInTheDocument();
    expect(screen.getByText("“The post says so.”")).toBeInTheDocument();
    expect(screen.getByText("Intro")).toBeInTheDocument();

    await act(async () => fireEvent.click(importButton()));
    expect(createQuizQuestions).toHaveBeenCalledWith({ blogId: "blog-1" }, expect.anything(), true, expect.any(Function));
    expect(quizField.setValue).toHaveBeenCalledWith({ sys: { type: "Link", linkType: "Entry", id: "quiz-new" } });
    expect(screen.getByText(/linked to this post/)).toBeInTheDocument();
    expect(input()).toHaveValue("");
  });

  it("adds to an already linked quiz without relinking, and shows draft errors", async () => {
    quizField.getValue.mockReturnValue({ sys: { id: "quiz-old" } });
    (generateQuizQuestions as jest.Mock).mockRejectedValue(new Error("Gemini is busy."));
    (createQuizQuestions as jest.Mock).mockResolvedValue({ quizId: "quiz-old" });
    render(<App />);
    expect(screen.getByText(/This post has a quiz/)).toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Draft from this post" })));
    expect(screen.getByText("Gemini is busy.")).toBeInTheDocument();

    setJson({ questions: [question("Pasted")] });
    await act(async () => fireEvent.click(importButton()));
    expect(quizField.setValue).not.toHaveBeenCalled();
    expect(screen.getByText(/Created 1 question\(s\) successfully/)).toBeInTheDocument();
  });
});
