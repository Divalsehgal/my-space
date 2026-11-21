import { validateQuestions, type QuizQuestion } from "@dival-sehgal/quiz/validate";
import { HTTP_STATUS } from "@dival-sehgal/utils/http";
import { APP_STATUS, appPreflight, appReply, readSignedBody } from "@/lib/contentful/app-request";
import {
  BLOG_CONTENT_TYPE,
  QUIZ_CONTENT_TYPE,
  type ManagedEntry,
  type ManagementConfig,
  contentfulRequest,
  getManagementConfig,
  importQuestions,
  importResponse,
} from "@/lib/contentful/quiz-import";

/**
 * Called by the Contentful quiz app (apps/contentful-quiz-app) from a quiz
 * entry: creates questions in Contentful and attaches them to the quiz. With
 * `blogId`, the blog's `quiz` field is then linked to this quiz (saved as a
 * draft; the editor publishes the blog). A blog already linked to another quiz
 * is refused, so each blog has exactly one quiz. Signed requests only.
 */
export const runtime = "nodejs";
// Questions are created one at a time against a rate-limited API.
export const maxDuration = 300;

const DEFAULT_LOCALE = process.env.CONTENTFUL_LOCALE || "en-US";

export const OPTIONS = appPreflight;

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

type ImportRequest = { quizId: string; blogId?: string; questions: QuizQuestion[]; publish: boolean };
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
  if (!isNonEmptyString(quizId)) {
    return appReply({ error: "quizId is required." }, HTTP_STATUS.BAD_REQUEST);
  }
  const validationErrors = validateQuestions(parsed.questions);
  if (validationErrors.length) {
    return appReply({ error: "Quiz JSON is invalid.", details: validationErrors }, HTTP_STATUS.BAD_REQUEST);
  }
  return {
    quizId,
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

type LinkedBlog = { blog: ManagedEntry; locale: string; linked: boolean };

/** The blog to link to this quiz, or the error reply when it isn't a blog or already has another quiz. */
async function loadBlog(config: ManagementConfig, blogId: string, quizId: string): Promise<LinkedBlog | Response> {
  const blog = await contentfulRequest(config, `/entries/${encodeURIComponent(blogId)}`);
  if (blog.sys.contentType?.sys.id !== BLOG_CONTENT_TYPE) {
    return appReply({ error: "The selected entry is not a Blog Page." }, HTTP_STATUS.BAD_REQUEST);
  }
  const locale = Object.keys(blog.fields?.title ?? {})[0] || DEFAULT_LOCALE;
  const linkedId = (blog.fields?.quiz?.[locale] as { sys?: { id?: string } } | undefined)?.sys?.id;
  if (linkedId && linkedId !== quizId) {
    return appReply({ error: "That blog already has a different quiz. Pick another blog." }, APP_STATUS.CONFLICT);
  }
  return { blog, locale, linked: linkedId === quizId };
}

/** Points the blog's `quiz` field at the quiz, as a draft. */
const linkBlog = (config: ManagementConfig, { blog, locale }: LinkedBlog, quizId: string) =>
  contentfulRequest(config, `/entries/${blog.sys.id}`, {
    method: "PUT",
    headers: { "X-Contentful-Version": String(blog.sys.version) },
    body: JSON.stringify({ fields: { ...blog.fields, quiz: { [locale]: { sys: { type: "Link", linkType: "Entry", id: quizId } } } } }),
  });

export async function POST(req: Request) {
  const raw = await readSignedBody(req);
  if (raw instanceof Response) { return raw; }
  const request = parseBody(raw);
  if (request instanceof Response) { return request; }

  try {
    const config = getManagementConfig();
    const blog = request.blogId ? await loadBlog(config, request.blogId, request.quizId) : null;
    if (blog instanceof Response) { return blog; }
    const resolved = await loadQuiz(config, request.quizId);
    if (resolved instanceof Response) { return resolved; }
    const result = await importQuestions({ config, ...resolved, publish: request.publish, questions: request.questions });
    const { ok, body } = importResponse(result, { total: request.questions.length, publish: request.publish });
    const linkedBlog = Boolean(blog && !blog.linked && result.createdQuestionIds.length);
    if (blog && linkedBlog) { await linkBlog(config, blog, request.quizId); }
    return appReply({ ...body, linkedBlog }, ok ? HTTP_STATUS.OK : APP_STATUS.BAD_GATEWAY);
  } catch (error) {
    console.error("Error creating quiz questions:", error);
    return appReply({ error: error instanceof Error ? error.message : "Unknown server error." }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
