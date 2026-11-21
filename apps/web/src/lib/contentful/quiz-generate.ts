import { randomInt } from "node:crypto";
import { validateQuestion, type QuizQuestion } from "@dival-sehgal/quiz/validate";
import { chunkSections, type Section } from "./quiz-sections";

/**
 * Generates quiz questions from a blog post with the Gemini API (free tier).
 * Gemini reads a whole post in one call; only a post longer than
 * MAX_PROMPT_CHARS is split (see quiz-sections.ts). Every question must quote
 * the sentence it is based on. Questions whose quote is
 * not in the post, that are malformed, or that repeat an existing question are
 * dropped before the editor sees them.
 */

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
/**
 * Tried in order: free-tier models are often briefly overloaded (503), so the
 * next one takes over. GEMINI_MODEL (comma-separated) overrides the list.
 */
// Lite models answer in ~2s without "thinking"; the full flash model is the slower fallback.
const DEFAULT_MODELS = "gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-3.5-flash";
/** ~100k tokens: well within free Gemini models' context, so a normal post is one call. */
const MAX_PROMPT_CHARS = 400_000;
/** Quotes shorter than this are too vague to prove anything. */
const MIN_QUOTE_CHARS = 20;
// A hung model is skipped quickly so the next one fits within the route's maxDuration.
const GEMINI_TIMEOUT_MS = 30_000;
const ATTEMPTS_PER_MODEL = 2;
const RETRY_DELAY_MS = 10_000;
const MS_PER_SECOND = 1000;
const TOO_MANY_REQUESTS = 429;
const SERVER_ERROR = 500;
const NOT_FOUND = 404;
const UNAVAILABLE = 503;

export type { Section };

export interface GeneratedQuestion extends QuizQuestion {
  /** The sentence from the post that supports the correct answer. */
  sourceQuote: string;
  /** The heading of the part of the post the question comes from. */
  section: string;
}

/** Lowercase words only, so a quote matches despite punctuation, quotes or Markdown differences. */
export const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const QUESTION_SCHEMA = {
  type: "OBJECT",
  properties: {
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          questionText: { type: "STRING" },
          options: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: { text: { type: "STRING" }, isCorrect: { type: "BOOLEAN" } },
              required: ["text", "isCorrect"],
            },
          },
          explanation: { type: "STRING" },
          difficulty: { type: "STRING", enum: ["easy", "medium", "hard"] },
          sourceQuote: { type: "STRING" },
        },
        required: ["questionText", "options", "explanation", "difficulty", "sourceQuote"],
      },
    },
  },
  required: ["questions"],
};

const SYSTEM_PROMPT = `You write multiple-choice quiz questions that check whether a reader understood a technical blog post.
Rules:
- Use only facts and reasoning stated in the excerpt you are given. Never rely on outside knowledge.
- Ask about concepts, trade-offs, causes and behaviour, not trivia such as names, dates or exact numbers.
- Each question has exactly 4 options and exactly 1 correct option. Wrong options must be plausible to someone who skimmed, but clearly wrong according to the excerpt. Never use "all of the above" or "none of the above".
- The explanation (1-2 sentences) says why the correct option is right, in your own words.
- sourceQuote is one sentence copied word for word from the excerpt that supports the correct answer.
- Mix difficulties. Do not repeat or rephrase any question listed as already existing.`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Retry delay Gemini suggests on a 429 (e.g. "RetryInfo.retryDelay": "12s"), else a fixed wait. */
async function retryDelayMs(response: Response): Promise<number> {
  try {
    const body = await response.clone().json();
    const hint = body?.error?.details?.find((detail: { retryDelay?: string }) => detail.retryDelay)?.retryDelay;
    const seconds = Number.parseFloat(String(hint));
    if (Number.isFinite(seconds)) { return seconds * MS_PER_SECOND; }
  } catch {
    // No JSON body; use the default wait.
  }
  return RETRY_DELAY_MS;
}

const ERROR_DETAIL_CHARS = 300;

function requestGemini(apiKey: string, model: string, prompt: string): Promise<Response> {
  return fetch(`${GEMINI_URL}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: QUESTION_SCHEMA, temperature: 0.4 },
    }),
  });
}

/** The JSON the model wrote, or null when it isn't valid JSON. */
function candidateJson(data: { candidates?: { content?: { parts?: { text?: string }[] } }[] }): { questions?: unknown[] } | null {
  const text = (data.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? "").join("");
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const isRetryable = (response: Response) => response.status === TOO_MANY_REQUESTS || response.status >= SERVER_ERROR;

/** One model's answer: the JSON, or why it failed and whether another try could help. */
async function tryModel(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<{ json?: { questions?: unknown[] }; error?: Error; wait?: number; skipModel?: boolean }> {
  let response: Response;
  try {
    response = await requestGemini(apiKey, model, prompt);
  } catch (error) {
    // Timeouts and network errors: this model is stuck, try the next one.
    return { error: new Error(`Gemini ${model} did not answer: ${error instanceof Error ? error.message : error}`), skipModel: true };
  }
  if (response.status === NOT_FOUND) {
    // Retired or not offered to this key: go straight to the next model.
    return { error: new Error(`Gemini ${model} is not available to this API key.`), skipModel: true };
  }
  if (response.status === UNAVAILABLE) {
    // "High demand" on the free tier: another model is usually free right now.
    return { error: new Error(`Gemini ${model} is overloaded (503).`), skipModel: true };
  }
  if (isRetryable(response)) {
    return { error: new Error(`Gemini ${model} is unavailable (${response.status}).`), wait: await retryDelayMs(response) };
  }
  if (!response.ok) {
    throw new Error(`Gemini request failed (${response.status}): ${(await response.text()).slice(0, ERROR_DETAIL_CHARS)}`);
  }
  const json = candidateJson(await response.json());
  return json ? { json } : { error: new Error(`Gemini ${model} returned malformed JSON.`), wait: 0 };
}

/**
 * One Gemini answer as JSON matching QUESTION_SCHEMA. Each model gets a retry
 * for rate limits, overload and malformed JSON before the next model is tried.
 */
async function askGemini(prompt: string): Promise<{ questions?: unknown[] }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { throw new Error("Missing GEMINI_API_KEY."); }
  const models = (process.env.GEMINI_MODEL || DEFAULT_MODELS).split(",").map((model) => model.trim()).filter(Boolean);
  let lastError = new Error("No Gemini model configured.");
  for (const model of models) {
    for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt += 1) {
      const { json, error, wait = 0, skipModel } = await tryModel(apiKey, model, prompt); // NOSONAR: each try depends on the previous one
      if (json) { return json; }
      lastError = error ?? lastError;
      if (skipModel) { break; }
      // Wait before retrying the same model; switch models straight away.
      if (attempt < ATTEMPTS_PER_MODEL) { await sleep(wait); }
    }
  }
  throw lastError;
}

/** Fisher–Yates shuffle, so the correct answer isn't always where the model put it. */
function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = randomInt(index + 1);
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

/** Keeps a raw model question only if it is well-formed and its quote really appears in the chunk. */
function acceptQuestion(raw: unknown, chunk: Section, sections: Section[]): GeneratedQuestion | null {
  const question = raw as Partial<GeneratedQuestion>;
  if (validateQuestion(question, 1).length) { return null; }
  const quote = normalize(question.sourceQuote ?? "");
  if (quote.length < MIN_QUOTE_CHARS || !normalize(chunk.text).includes(quote)) { return null; }
  return {
    questionText: String(question.questionText).trim(),
    options: shuffled(question.options ?? []).map((option) => ({ text: option.text.trim(), isCorrect: option.isCorrect })),
    explanation: String(question.explanation).trim(),
    difficulty: question.difficulty,
    sourceQuote: String(question.sourceQuote).trim(),
    // A chunk can hold several sections; name the one the quote comes from.
    section: sections.find((section) => normalize(section.text).includes(quote))?.heading ?? chunk.heading,
  };
}

export interface GenerateOptions {
  title: string;
  sections: Section[];
  /** Questions the quiz already has, so new ones don't repeat them. */
  existing: string[];
  count: number;
}

/**
 * Generates up to `count` verified questions spread across the post. Returns
 * them with how many raw questions were dropped by the checks.
 */
export async function generateQuestions({ title, sections, existing, count }: GenerateOptions) {
  const chunks = chunkSections(sections, MAX_PROMPT_CHARS);
  const totalChars = chunks.reduce((sum, chunk) => sum + chunk.text.length, 0) || 1;
  const seen = new Set(existing.map(normalize));
  const perChunk: GeneratedQuestion[][] = [];
  let dropped = 0;

  // Sequential, not parallel: the free tier allows only a few requests per minute.
  for (const chunk of chunks) {
    // Ask for one extra per chunk so the checks below still leave enough.
    const wanted = Math.max(1, Math.round((count * chunk.text.length) / totalChars)) + 1;
    const prompt = [
      `Blog post: "${title}"`,
      `Write ${wanted} question(s) about this excerpt from the post.`,
      existing.length ? `Already existing questions (do not repeat):\n${existing.map((text) => `- ${text}`).join("\n")}` : "",
      `Excerpt:\n"""\n${chunk.text}\n"""`,
    ].filter(Boolean).join("\n\n");
    const { questions = [] } = await askGemini(prompt);
    const accepted: GeneratedQuestion[] = [];
    for (const raw of questions) {
      const question = acceptQuestion(raw, chunk, sections);
      const key = question && normalize(question.questionText);
      if (!question || !key || seen.has(key)) { dropped += 1; continue; }
      seen.add(key);
      accepted.push(question);
    }
    perChunk.push(accepted);
  }

  // Take questions round-robin across chunks so the quiz covers the whole post.
  const picked: GeneratedQuestion[] = [];
  for (let round = 0; picked.length < count && perChunk.some((list) => list.length > round); round += 1) {
    for (const list of perChunk) {
      if (list[round] && picked.length < count) { picked.push(list[round]); }
    }
  }
  return { questions: picked, dropped };
}
