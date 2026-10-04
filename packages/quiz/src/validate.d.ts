export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  questionText: string;
  options: QuizOption[];
  explanation: string;
  difficulty?: string;
}

export interface QuizPayload {
  questions: QuizQuestion[];
}

export declare const OPTIONS_PER_QUESTION: number;
export declare const CORRECT_OPTIONS_PER_QUESTION: number;

/** Problems with one question (empty when valid); `number` is 1-based. */
export declare function validateQuestion(question: unknown, number: number): string[];
/** Problems with a list of questions (empty when all are valid). */
export declare function validateQuestions(questions: unknown): string[];
/** Parses `{ "questions": [...] }` JSON; throws listing every problem. */
export declare function parseQuizPayload(raw: string): QuizPayload;
/** Letter for an option by position: 0 → "A", 1 → "B"… */
export declare function optionLetter(index: number): string;
