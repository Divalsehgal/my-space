import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";
import { createQuizQuestions } from "./api/createQuizQuestions";
import { generateQuizQuestions } from "./api/generateQuizQuestions";

type Children = { children?: React.ReactNode };

const blog = (id: string, title: string, quizId?: string) => ({
  sys: { id },
  fields: { title: { "en-US": title }, ...(quizId ? { quiz: { "en-US": { sys: { id: quizId } } } } : {}) },
});
const getMany = jest.fn();
const mockSdk = {
  ids: { entry: "quiz-1", contentType: "quizComponent", app: "app-1" },
  locales: { default: "en-US" },
  window: { startAutoResizer: jest.fn() },
  cma: { entry: { getMany }, appSignedRequest: { create: jest.fn(() => Promise.resolve({ additionalHeaders: { sig: "1" } })) } },
};
jest.mock("@contentful/react-apps-toolkit", () => ({ useSDK: () => mockSdk }));
jest.mock("./api/createQuizQuestions", () => ({ createQuizQuestions: jest.fn() }));
jest.mock("./api/generateQuizQuestions", () => ({ generateQuizQuestions: jest.fn() }));
// f36 pulls in emotion and a large ESM tree; plain elements are enough here.
jest.mock("@contentful/f36-components", () => {
  const Plain = ({ children }: Children) => <div>{children}</div>;
  type SelectProps = Children & { value: string; onChange: React.ChangeEventHandler<HTMLSelectElement>; isDisabled?: boolean; "aria-label": string };
  const Select = ({ children, value, onChange, isDisabled, ...rest }: SelectProps) => (
    <select aria-label={rest["aria-label"]} value={value} onChange={onChange} disabled={isDisabled}>{children}</select>
  );
  Select.Option = ({ children, value }: Children & { value: string }) => <option value={value}>{children}</option>;
  return {
    Heading: ({ children }: Children) => <h2>{children}</h2>,
    Paragraph: ({ children }: Children) => <p>{children}</p>,
    Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
    Button: ({ isDisabled, onClick, children, ...rest }: Children & { isDisabled?: boolean; onClick: () => void; "aria-label"?: string }) => (
      <button disabled={isDisabled} onClick={onClick} aria-label={rest["aria-label"]}>{children}</button>
    ),
    Checkbox: ({ children, isChecked, onChange }: Children & { isChecked: boolean; onChange: React.ChangeEventHandler<HTMLInputElement> }) => (
      <label><input type="checkbox" checked={isChecked} onChange={onChange} />{children}</label>
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
const blogSelect = () => screen.getByLabelText("Blog post");
const setJson = (value: unknown) => fireEvent.change(input(), { target: { value: typeof value === "string" ? value : JSON.stringify(value) } });
const importButton = () => screen.getByRole("button", { name: /^Import/ });
const renderApp = async () => { await act(async () => { render(<App />); }); };

describe("App", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSdk.ids = { entry: "quiz-1", contentType: "quizComponent", app: "app-1" };
    getMany.mockResolvedValue({ items: [blog("b2", "Zeta"), blog("b1", "Alpha"), blog("b3", "Taken", "other-quiz")] });
  });

  it("lists only blogs without a quiz, and needs one before drafting or importing", async () => {
    await renderApp();
    expect(mockSdk.window.startAutoResizer).toHaveBeenCalled();
    const options = [...blogSelect().querySelectorAll("option")].map((option) => option.textContent);
    expect(options).toEqual(["Choose the blog this quiz is for", "Alpha", "Zeta"]);
    expect(blogSelect()).not.toBeDisabled();
    setJson({ questions: [question("Q")] });
    expect(importButton()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Draft from the blog" })).toBeDisabled();
  });

  it("drafts from the chosen blog, then imports and links it", async () => {
    (generateQuizQuestions as jest.Mock).mockResolvedValue({
      questions: [{ ...question("Drafted?"), sourceQuote: "The post says so.", section: "Intro" }],
      dropped: 2,
      existingCount: 0,
    });
    (createQuizQuestions as jest.Mock).mockResolvedValue({ message: "Created.", linkedBlog: true });
    await renderApp();
    fireEvent.change(blogSelect(), { target: { value: "b1" } });
    fireEvent.change(screen.getByLabelText("Number of questions"), { target: { value: "4" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Draft from the blog" })));
    expect(generateQuizQuestions).toHaveBeenCalledWith("b1", "quiz-1", 4, expect.any(Function));
    expect(screen.getByText(/Drafted 1 question\(s\), 2 dropped/)).toBeInTheDocument();
    expect(screen.getByText("“The post says so.”")).toBeInTheDocument();
    expect(screen.getByText("Intro")).toBeInTheDocument();

    await act(async () => fireEvent.click(importButton()));
    expect(createQuizQuestions).toHaveBeenCalledWith({ quizId: "quiz-1", blogId: "b1" }, expect.anything(), true, expect.any(Function));
    expect(screen.getByText(/The blog now links to this quiz/)).toBeInTheDocument();
    expect(input()).toHaveValue("");
  });

  it("keeps a quiz with the blog it is already linked to", async () => {
    getMany.mockResolvedValue({ items: [blog("b1", "Alpha"), blog("b9", "Mine", "quiz-1")] });
    (createQuizQuestions as jest.Mock).mockResolvedValue({});
    await renderApp();
    expect(blogSelect()).toHaveValue("b9");
    expect(blogSelect()).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    setJson({ questions: [question("Pasted")] });
    await act(async () => fireEvent.click(importButton()));
    expect(createQuizQuestions).toHaveBeenCalledWith({ quizId: "quiz-1", blogId: "b9" }, expect.anything(), false, expect.any(Function));
    expect(screen.getByText("Created 1 question(s) successfully.")).toBeInTheDocument();
  });

  it("previews, removes and validates pasted questions, and shows errors", async () => {
    getMany.mockResolvedValue({ items: [blog("b9", "Mine", "quiz-1")] });
    await renderApp();
    setJson({ questions: [question("One"), question("Two", "")] });
    expect(screen.getByText(/Import preview \(2 questions\)/)).toBeInTheDocument();
    expect(screen.getByText("Missing explanation")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove question 1" }));
    expect(screen.getByText(/Import preview \(1 question\)/)).toBeInTheDocument();

    setJson({ questions: [{ questionText: "Q" }] });
    await act(async () => fireEvent.click(importButton()));
    expect(createQuizQuestions).not.toHaveBeenCalled();
    expect(screen.getByRole("note")).toHaveTextContent(/question/i);

    setJson({ questions: [question("Q")] });
    (createQuizQuestions as jest.Mock).mockRejectedValue("weird");
    await act(async () => fireEvent.click(importButton()));
    expect(screen.getByText("Unknown error creating questions.")).toBeInTheDocument();
  });

  it("explains a failed blog list and other entry types", async () => {
    getMany.mockRejectedValue(new Error("no"));
    await renderApp();
    expect(screen.getByText(/Could not load the blog list/)).toBeInTheDocument();
  });

  it("only runs on quiz entries", async () => {
    mockSdk.ids = { entry: "blog-1", contentType: "blogPage", app: "app-1" };
    await renderApp();
    expect(screen.getByText(/Open this app from a/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Quiz JSON input")).not.toBeInTheDocument();
  });
});
