import { parseQuizPayload, validateQuestions } from "./validate";

const question = (overrides = {}) => ({
  questionText: "Capital of France?",
  explanation: "Paris is the capital.",
  options: [
    { text: "Berlin", isCorrect: false },
    { text: "Paris", isCorrect: true },
    { text: "Rome", isCorrect: false },
    { text: "Madrid", isCorrect: false },
  ],
  ...overrides,
});

describe("quiz validation", () => {
  it("accepts a well-formed question", () => {
    expect(validateQuestions([question()])).toEqual([]);
  });

  it("requires at least one question", () => {
    expect(validateQuestions([])).toEqual(["Add at least one question."]);
    expect(validateQuestions(undefined)).toEqual(["Add at least one question."]);
  });

  it("reports every problem with its question number", () => {
    const bad = question({
      questionText: " ",
      options: [
        { text: "A", isCorrect: true },
        { text: "a", isCorrect: true },
        { text: "", isCorrect: false },
        { text: "D", isCorrect: false },
      ],
    });
    expect(validateQuestions([question(), bad])).toEqual([
      "Question 2 needs questionText.",
      "Question 2 has an empty option.",
      "Question 2 has duplicate option text.",
      "Question 2 must have exactly one correct option.",
    ]);
  });

  it("requires exactly four options", () => {
    expect(validateQuestions([question({ options: [] })])).toEqual(["Question 1 must contain exactly 4 options."]);
  });

  it("parses editor JSON and throws with all problems", () => {
    expect(parseQuizPayload(JSON.stringify({ questions: [question()] })).questions).toHaveLength(1);
    expect(() => parseQuizPayload("{}")).toThrow('top-level "questions" array');
    expect(() => parseQuizPayload(JSON.stringify({ questions: [question({ explanation: "" })] }))).toThrow(
      "Question 1 needs an explanation.",
    );
  });
});
