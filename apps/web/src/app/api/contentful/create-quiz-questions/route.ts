import { validateQuestions, type QuizQuestion } from "@dival-sehgal/quiz/validate";
import { HTTP_STATUS } from "@dival-sehgal/utils/http";
import { APP_STATUS, appPreflight, appReply, readSignedBody } from "@/lib/contentful/app-request";
import {
  BLOG_CONTENT_TYPE,
  QUIZ_CONTENT_TYPE,
  type ManagedEntry,
  type ManagementConfig,
  contentfulRequest,
  createEntry,
  getManagementConfig,
  importQuestions,
  importResponse,
} from "@/lib/contentful/quiz-import";

/**
 * Called by the Contentful quiz app (apps/contentful-quiz-app): creates
 * questions in Contentful and attaches them to a quiz. The target is either a
 * quiz entry (`quizId`) or a blog post (`blogId`), in which case the blog's
 * linked quiz is used or a new one is created; the reply always carries
 * `quizId` so the app can link a new quiz to the blog. Only requests signed by
 * the installed app are accepted.
 */
export const runtime = "nodejs";
// Questions are created one at a time against a rate-limited API.
export const maxDuration = 300;

const DEFAULT_LOCALE = process.env.CONTENTFUL_LOCALE || "en-US";

export const OPTIONS = appPreflight;

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

type ImportRequest = { quizId?: string; blogId?: string; questions: QuizQuestion[]; publish: boolean };
type ResolvedQuiz = { quiz: ManagedEntry; locale: string };

/** The validated request body, or the error reply to send instead. */
function parseBody(raw: string): ImportRequest | Response {
  let parsed: { quizId?: unknown; blogId?: unknown; questions?: unknown; publish?: unknown };
  try {
    parsed = JSON.parse(raw) ?? {};
  } catch {
    return appReply({ error: "Body must be JSON." }, HTTP_STATUS.BAD_REQUEST);
  }
  const { quizId, blogId } = parsed;
  if (!isNonEmptyString(quizId) && !isNonEmptyString(blogId)) {
    return appReply({ error: "quizId or blogId is required." }, HTTP_STATUS.BAD_REQUEST);
  }
  const validationErrors = validateQuestions(parsed.questions);
  if (validationErrors.length) {
    return appReply({ error: "Quiz JSON is invalid.", details: validationErrors }, HTTP_STATUS.BAD_REQUEST);
  }
  return {
    quizId: isNonEmptyString(quizId) ? quizId : undefined,
    blogId: isNonEmptyString(blogId) ? blogId : undefined,
    questions: parsed.questions as QuizQuestion[],
    publish: parsed.publish !== false,
  };
}

/** Loads the quiz entry and checks it can take new questions; returns an error reply instead when it can't. */
async function loadQuiz(config: ManagementConfig, quizId: string): Promise<ResolvedQuiz | Response> {
  const quiz = await contentfulRequest(config, `/entries/${encodeURIComponent(quizId)}`);
  if (quiz.sys?.contentType?.sys?.id !== QUIZ_CONTENT_TYPE) {
    return appReply({ error: "Open a Component - Quiz entry before importing questions." }, HTTP_STATUS.BAD_REQUEST);
  }
  const locale = Object.keys(quiz.fields?.title || {})[0] || DEFAULT_LOCALE;
  if (!Array.isArray(quiz.fields?.questionEntries?.[locale] || [])) {
    return appReply(
      { error: "The quiz Questions reference field is not configured correctly. Run the content-model sync before importing." },
      APP_STATUS.CONFLICT,
    );
  }
  return { quiz, locale };
}

/** The blog's linked quiz, or a new empty quiz named after the blog (the app links it to the blog). */
async function quizForBlog(config: ManagementConfig, blogId: string): Promise<ResolvedQuiz | Response> {
  const blog = await contentfulRequest(config, `/entries/${encodeURIComponent(blogId)}`);
  if (blog.sys.contentType?.sys.id !== BLOG_CONTENT_TYPE) {
    return appReply({ error: "Open a Blog Page entry to create its quiz." }, HTTP_STATUS.BAD_REQUEST);
  }
  const fields = blog.fields ?? {};
  const locale = Object.keys(fields.title ?? {})[0] || DEFAULT_LOCALE;
  const linkedId = (fields.quiz?.[locale] as { sys?: { id?: string } } | undefined)?.sys?.id;
  if (linkedId) {
    return loadQuiz(config, linkedId);
  }
  const title = String(fields.title?.[locale] || "Untitled blog");
  const quiz = await createEntry(config, QUIZ_CONTENT_TYPE, { title: { [locale]: `${title} — Quiz` } });
  return { quiz, locale };
}

export async function POST(req: Request) {
  const raw = await readSignedBody(req);
  if (raw instanceof Response) { return raw; }
  const request = parseBody(raw);
  if (request instanceof Response) { return request; }

  try {
    const config = getManagementConfig();
    const resolved = request.quizId ? await loadQuiz(config, request.quizId) : await quizForBlog(config, request.blogId as string);
    if (resolved instanceof Response) { return resolved; }
    const result = await importQuestions({ config, ...resolved, publish: request.publish, questions: request.questions });
    const { ok, body } = importResponse(result, { total: request.questions.length, publish: request.publish });
    return appReply({ ...body, quizId: resolved.quiz.sys.id }, ok ? HTTP_STATUS.OK : APP_STATUS.BAD_GATEWAY);
  } catch (error) {
    console.error("Error creating quiz questions:", error);
    return appReply({ error: error instanceof Error ? error.message : "Unknown server error." }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
