import crypto from "node:crypto";
import { optionLetter, type QuizQuestion } from "@dival-sehgal/quiz/validate";

/**
 * Creates quiz questions in Contentful through the Management API for the
 * Contentful quiz editor app (apps/contentful-quiz-app). Called from
 * /api/contentful/create-quiz-questions. Ported from the app's old Express server.
 */

const MS_PER_SECOND = 1000;
/** Contentful's Management API allows ~7 requests/second, so calls are spaced out by this much. */
const MIN_REQUEST_INTERVAL_MS = 200;
const MAX_RETRIES = 5;
/** Exponential backoff base: 500ms, 1s, 2s… */
const RETRY_BASE_DELAY_MS = 500;
/** Extra wait added to Contentful's rate-limit reset hint. */
const RETRY_AFTER_PADDING_MS = 100;
const SHORT_ID_LENGTH = 8;
/** Question titles in Contentful show this much of the question text. */
const TITLE_PREVIEW_CHARS = 80;
const TOO_MANY_REQUESTS = 429;
const SERVER_ERROR = 500;

export const QUIZ_CONTENT_TYPE = "quizComponent";

export interface ManagementConfig {
  spaceId: string;
  accessToken: string;
  environmentId: string;
}

/** The parts of a Management API entry this importer reads. */
export interface ManagedEntry {
  sys: { id: string; version: number; contentType?: { sys: { id: string } } };
  fields?: Record<string, Record<string, unknown> | undefined>;
}

export interface ImportResult {
  createdQuestionIds: string[];
  failure: { questionIndex: number; message: string } | null;
  quizPublishError: string | null;
}

export const getManagementConfig = (): ManagementConfig => {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  const environmentId = process.env.CONTENTFUL_ENVIRONMENT_ID || "master";
  if (!spaceId || !accessToken) {
    throw new Error("Missing CONTENTFUL_SPACE_ID or CONTENTFUL_MANAGEMENT_TOKEN.");
  }
  return { spaceId, accessToken, environmentId };
};

const createRichText = (text: string) => ({
  nodeType: "document",
  data: {},
  content: [{ nodeType: "paragraph", data: {}, content: [{ nodeType: "text", value: text, marks: [], data: {} }] }],
});

const createEntryLink = (id: string) => ({ sys: { type: "Link", linkType: "Entry", id } });
const shortId = () => crypto.randomUUID().slice(0, SHORT_ID_LENGTH);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const backoff = (attempt: number) => RETRY_BASE_DELAY_MS * 2 ** attempt;
const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

// All requests go through this chain so they never fire in parallel bursts.
// Parallel calls caused "too many requests" errors when several questions were generated at once.
let requestChain: Promise<unknown> = Promise.resolve();

function paced<T>(fn: () => Promise<T>): Promise<T> {
  const run = requestChain.then(async () => {
    try {
      return await fn();
    } finally {
      await sleep(MIN_REQUEST_INTERVAL_MS);
    }
  });
  // Keep the chain alive even if this call fails, so later calls still wait their turn.
  requestChain = run.then(() => undefined, () => undefined);
  return run;
}

/** How long to wait before retrying a rate-limited or failed response, using Contentful's reset hint when present. */
function retryDelay(response: Response, attempt: number): number {
  const header = response.headers.get("x-contentful-ratelimit-reset") || response.headers.get("retry-after");
  const seconds = header ? Number(header) : Number.NaN;
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * MS_PER_SECOND + RETRY_AFTER_PADDING_MS : backoff(attempt);
}

const isRetryable = (response: Response) => response.status === TOO_MANY_REQUESTS || response.status >= SERVER_ERROR;

async function fetchWithRetries(url: string, init: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, init); // NOSONAR: retry loop; each attempt depends on the previous one
    } catch (networkError) {
      // Transient DNS or connection failures (not Contentful errors) are retried the same way.
      if (attempt >= MAX_RETRIES) { throw networkError; }
      await sleep(backoff(attempt));
      continue;
    }
    if (!isRetryable(response) || attempt >= MAX_RETRIES) { return response; }
    await sleep(retryDelay(response, attempt));
  }
}

/** Management API call: paced, retried on 429/5xx, JSON in and out. */
export function contentfulRequest<T = ManagedEntry>(config: ManagementConfig, urlPath: string, options: RequestInit = {}): Promise<T> {
  return paced(async () => {
    const response = await fetchWithRetries(
      `https://api.contentful.com/spaces/${config.spaceId}/environments/${config.environmentId}${urlPath}`,
      {
        ...options,
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/vnd.contentful.management.v1+json",
          ...options.headers,
        },
      },
    );
    const body = await response.text();
    const data = body ? JSON.parse(body) : null;
    if (!response.ok) {
      throw new Error(`Contentful request failed (${response.status}): ${data?.message || body || response.statusText}`);
    }
    return data as T;
  });
}

const createEntry = (config: ManagementConfig, contentTypeId: string, fields: Record<string, unknown>) =>
  contentfulRequest(config, "/entries", {
    method: "POST",
    headers: { "X-Contentful-Content-Type": contentTypeId },
    body: JSON.stringify({ fields }),
  });

const publishEntry = (config: ManagementConfig, entry: ManagedEntry) =>
  contentfulRequest(config, `/entries/${entry.sys.id}/published`, {
    method: "PUT",
    headers: { "X-Contentful-Version": String(entry.sys.version) },
    body: JSON.stringify({}),
  });

interface ImportContext {
  config: ManagementConfig;
  locale: string;
  publish: boolean;
}

/** Creates (and optionally publishes) one question with its four option entries. */
async function createQuestion({ config, locale, publish }: ImportContext, question: QuizQuestion, number: number) {
  // A random suffix keeps each option's unique `key` field from colliding across
  // re-runs and duplicate question text, so a retry never hits "key already exists".
  const optionEntries = await Promise.all(
    question.options.map((option, index) =>
      createEntry(config, "quizOption", {
        key: { [locale]: `${question.questionText.trim()} — Option ${optionLetter(index)} — ${shortId()}` },
        text: { [locale]: createRichText(option.text.trim()) },
      }),
    ),
  );
  const options = publish ? await Promise.all(optionEntries.map((entry) => publishEntry(config, entry))) : optionEntries;
  const correctIndex = question.options.findIndex((option) => option.isCorrect);
  const entry = await createEntry(config, "questionComponent", {
    title: { [locale]: `Question ${number}: ${question.questionText.trim().slice(0, TITLE_PREVIEW_CHARS)}` },
    questionText: { [locale]: createRichText(question.questionText.trim()) },
    options: { [locale]: options.map((option) => createEntryLink(option.sys.id)) },
    correctAnswer: { [locale]: createEntryLink(options[correctIndex].sys.id) },
    explanation: { [locale]: createRichText(question.explanation.trim()) },
  });
  return publish ? publishEntry(config, entry) : entry;
}

/** Saves the quiz as a draft with the given question links. */
const attachQuestions = (config: ManagementConfig, quiz: ManagedEntry, locale: string, links: unknown[]) =>
  contentfulRequest(config, `/entries/${quiz.sys.id}`, {
    method: "PUT",
    headers: { "X-Contentful-Version": String(quiz.sys.version) },
    body: JSON.stringify({ fields: { ...quiz.fields, questionEntries: { [locale]: links } } }),
  });

/**
 * Creates the questions in order and attaches each one to the quiz as soon as it
 * exists, so a later failure never leaves earlier questions unlinked. Stops at
 * the first failure, and publishes the quiz at the end when asked.
 */
export async function importQuestions(
  { config, quiz, locale, publish, questions }: ImportContext & { quiz: ManagedEntry; questions: QuizQuestion[] },
): Promise<ImportResult> {
  const existing = (quiz.fields?.questionEntries?.[locale] as unknown[] | undefined) || [];
  const createdQuestionIds: string[] = [];
  let current = quiz;
  let failure: ImportResult["failure"] = null;

  for (const [questionIndex, question] of questions.entries()) {
    try {
      const created = await createQuestion({ config, locale, publish }, question, existing.length + createdQuestionIds.length + 1);
      createdQuestionIds.push(created.sys.id);
      current = await attachQuestions(config, current, locale, [...existing, ...createdQuestionIds.map(createEntryLink)]);
    } catch (error) {
      failure = { questionIndex, message: errorMessage(error, "Unknown error creating this question.") };
      break;
    }
  }

  let quizPublishError: string | null = null;
  if (publish && createdQuestionIds.length) {
    try {
      await publishEntry(config, current);
    } catch (error) {
      quizPublishError = errorMessage(error, "Unknown error publishing the quiz.");
    }
  }
  return { createdQuestionIds, failure, quizPublishError };
}

/** What to tell the editor when only some questions were created, or the quiz didn't publish. */
function recoveryHint({ createdQuestionIds, failure, quizPublishError }: ImportResult): string {
  if (createdQuestionIds.length === 0) { return "No questions were created. Re-run the import."; }
  const outcome = quizPublishError
    ? " and saved to the quiz in draft (quiz publish failed - open the quiz entry in Contentful and publish it manually, or re-run once the connection issue clears)"
    : ", attached, and published successfully";
  const next = failure ? ` Re-run the import with only the remaining question(s) from question ${failure.questionIndex + 1} onward.` : "";
  return `The first ${createdQuestionIds.length} question(s) were created${outcome}.${next}`;
}

/** Whether the import fully succeeded, and the JSON body to send back. */
export function importResponse(result: ImportResult, { total, publish }: { total: number; publish: boolean }) {
  const { createdQuestionIds, failure, quizPublishError } = result;
  if (!failure && !quizPublishError) {
    return {
      ok: true,
      body: {
        success: true,
        createdQuestionIds,
        published: publish,
        message: `Created, attached, and ${publish ? "published" : "saved"} ${createdQuestionIds.length} question(s).`,
      },
    };
  }
  const messages = [
    failure && `Failed while creating question ${failure.questionIndex + 1} of ${total}: ${failure.message}`,
    quizPublishError && `Failed to publish the quiz after attaching questions: ${quizPublishError}`,
  ].filter(Boolean);
  return { ok: false, body: { error: messages.join(" "), createdQuestionIds, hint: recoveryHint(result) } };
}
