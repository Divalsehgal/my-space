import { NextResponse } from "next/server";
import { verifyRequest } from "@contentful/node-apps-toolkit";
import { validateQuestions, type QuizQuestion } from "@dival-sehgal/quiz/validate";
import { HTTP_STATUS } from "@dival-sehgal/utils/http";
import {
  QUIZ_CONTENT_TYPE,
  type ManagedEntry,
  type ManagementConfig,
  contentfulRequest,
  getManagementConfig,
  importQuestions,
  importResponse,
} from "@/lib/contentful/quiz-import";

/**
 * Called by the Contentful quiz editor app (apps/contentful-quiz-app): creates
 * questions in Contentful and attaches them to a quiz entry. The app signs each
 * request with its signing secret, so only the installed app can create content.
 */
export const runtime = "nodejs";
// Questions are created one at a time against a rate-limited API.
export const maxDuration = 300;

const SIGNATURE_TTL_SECONDS = 60;
const DEFAULT_LOCALE = process.env.CONTENTFUL_LOCALE || "en-US";
const STATUS = { ...HTTP_STATUS, FORBIDDEN: 403, CONFLICT: 409, BAD_GATEWAY: 502 } as const;

// The app is served from Contentful's own domain, so the browser preflights this cross-origin call.
// Any origin is allowed because access is controlled by the signature, not by cookies.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

const reply = (body: unknown, status: number) => NextResponse.json(body, { status, headers: CORS_HEADERS });

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function isSigned(req: Request, body: string): boolean {
  const secret = process.env.CONTENTFUL_APP_SIGNING_SECRET;
  if (!secret) { return false; }
  try {
    return verifyRequest(
      secret,
      { method: "POST", path: new URL(req.url).pathname, headers: Object.fromEntries(req.headers), body },
      SIGNATURE_TTL_SECONDS,
    );
  } catch {
    // Expired, malformed or unsigned requests make verifyRequest throw.
    return false;
  }
}

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

type ImportRequest = { quizId: string; questions: QuizQuestion[]; publish: boolean };

/** The validated request body, or the error reply to send instead. */
function parseBody(raw: string): ImportRequest | Response {
  let parsed: { quizId?: unknown; questions?: unknown; publish?: unknown };
  try {
    parsed = JSON.parse(raw) ?? {};
  } catch {
    return reply({ error: "Body must be JSON." }, STATUS.BAD_REQUEST);
  }
  if (!isNonEmptyString(parsed.quizId)) {
    return reply({ error: "quizId is required." }, STATUS.BAD_REQUEST);
  }
  const validationErrors = validateQuestions(parsed.questions);
  if (validationErrors.length) {
    return reply({ error: "Quiz JSON is invalid.", details: validationErrors }, STATUS.BAD_REQUEST);
  }
  return { quizId: parsed.quizId, questions: parsed.questions as QuizQuestion[], publish: parsed.publish !== false };
}

/** Loads the quiz entry and checks it can take new questions; returns an error reply instead when it can't. */
async function loadQuiz(config: ManagementConfig, quizId: string): Promise<{ quiz: ManagedEntry; locale: string } | Response> {
  const quiz = await contentfulRequest(config, `/entries/${encodeURIComponent(quizId)}`);
  if (quiz.sys?.contentType?.sys?.id !== QUIZ_CONTENT_TYPE) {
    return reply({ error: "Open a Component - Quiz entry before importing questions." }, STATUS.BAD_REQUEST);
  }
  const locale = Object.keys(quiz.fields?.title || {})[0] || DEFAULT_LOCALE;
  if (!Array.isArray(quiz.fields?.questionEntries?.[locale] || [])) {
    return reply(
      { error: "The quiz Questions reference field is not configured correctly. Run the content-model sync before importing." },
      STATUS.CONFLICT,
    );
  }
  return { quiz, locale };
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!isSigned(req, raw)) {
    return reply({ error: "Request is not signed by the quiz app." }, STATUS.FORBIDDEN);
  }
  const request = parseBody(raw);
  if (request instanceof Response) { return request; }

  try {
    const config = getManagementConfig();
    const loaded = await loadQuiz(config, request.quizId);
    if (loaded instanceof Response) { return loaded; }
    const result = await importQuestions({ config, ...loaded, publish: request.publish, questions: request.questions });
    const { ok, body } = importResponse(result, { total: request.questions.length, publish: request.publish });
    return reply(body, ok ? HTTP_STATUS.OK : STATUS.BAD_GATEWAY);
  } catch (error) {
    console.error("Error creating quiz questions:", error);
    return reply({ error: error instanceof Error ? error.message : "Unknown server error." }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
