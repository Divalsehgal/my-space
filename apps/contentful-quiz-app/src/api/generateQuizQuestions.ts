import type { QuizQuestion } from '@dival-sehgal/quiz/validate';
import { signedPost, type Signer } from './signedPost';

export interface GeneratedQuestion extends QuizQuestion {
  /** The sentence from the post that supports the correct answer. */
  sourceQuote?: string;
  /** The heading of the part of the post the question comes from. */
  section?: string;
}

export interface GenerateResult {
  questions: GeneratedQuestion[];
  /** Questions the checks threw away (bad quote, malformed, repeated). */
  dropped: number;
  existingCount: number;
}

/** Asks the quiz API to draft questions from the blog's current text with Gemini. Nothing is saved. */
export const generateQuizQuestions = (blogId: string, count: number, sign: Signer): Promise<GenerateResult> =>
  signedPost<GenerateResult>('/contentful/generate-quiz', { blogId, count }, sign, 'Failed to generate questions.');
