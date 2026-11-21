import { HTTP_STATUS } from "@dival-sehgal/utils/http";
import { APP_STATUS, appPreflight, appReply, readSignedBody } from "@/lib/contentful/app-request";
import { generateQuestions } from "@/lib/contentful/quiz-generate";
import { richTextToSections, type RichNode, type Section } from "@/lib/contentful/quiz-sections";
import {
  BLOG_CONTENT_TYPE,
  contentfulRequest,
  getManagementConfig,
  type ManagedEntry,
  type ManagementConfig,
} from "@/lib/contentful/quiz-import";

/**
 * Called by the Contentful quiz app from a quiz entry: generates questions
 * from the chosen blog's current (draft) text for the editor to review,
 * skipping questions the quiz already has.
 * Nothing is written to Contentful here; the editor imports the reviewed
 * questions through /api/contentful/create-quiz-questions. Signed requests only.
 */
export const runtime = "nodejs";
// One Gemini call per chunk of the post, run one after another.
// Free-tier models are slow and sometimes need a fallback, so a long post can take ~2 minutes.
export const maxDuration = 300;

const DEFAULT_LOCALE = process.env.CONTENTFUL_LOCALE || "en-US";
const DEFAULT_COUNT = 6;
const MAX_COUNT = 10;

export const OPTIONS = appPreflight;

type Link = { sys?: { id?: string } };
type TextNode = { value?: string; content?: TextNode[] };
type Blog = { title: string; sections: Section[]; locale: string };

const field = (entry: ManagedEntry, name: string, locale: string): unknown => entry.fields?.[name]?.[locale];

/** Plain text of a rich-text field, for listing existing questions. */
const plain = (node: TextNode | undefined): string =>
  node ? (node.value ?? (node.content ?? []).map(plain).join(" ")).replace(/\s+/g, " ").trim() : "";

/** `{ blogId, quizId, count }` from the body, or the error reply to send instead. */
function parseBody(raw: string): { blogId: string; quizId?: string; count: number } | Response {
  let body: { blogId?: unknown; quizId?: unknown; count?: unknown };
  try {
    body = JSON.parse(raw) ?? {};
  } catch {
    return appReply({ error: "Body must be JSON." }, HTTP_STATUS.BAD_REQUEST);
  }
  if (typeof body.blogId !== "string" || !body.blogId.trim()) {
    return appReply({ error: "blogId is required." }, HTTP_STATUS.BAD_REQUEST);
  }
  const count = Math.min(Math.max(Math.trunc(Number(body.count)) || DEFAULT_COUNT, 1), MAX_COUNT);
  return { blogId: body.blogId, quizId: typeof body.quizId === "string" && body.quizId ? body.quizId : undefined, count };
}

/** The blog's title and Markdown sections, or the error reply to send instead. */
async function loadBlog(config: ManagementConfig, blogId: string): Promise<Blog | Response> {
  const blog = await contentfulRequest(config, `/entries/${encodeURIComponent(blogId)}`);
  if (blog.sys.contentType?.sys.id !== BLOG_CONTENT_TYPE) {
    return appReply({ error: "Open a Blog Page entry to generate its quiz." }, HTTP_STATUS.BAD_REQUEST);
  }
  const locale = Object.keys(blog.fields?.title ?? {})[0] || DEFAULT_LOCALE;
  const title = String(field(blog, "title", locale) || "Untitled blog");
  const sections = richTextToSections(field(blog, "body", locale) as { content?: RichNode[] } | undefined, title);
  if (!sections.length) {
    return appReply({ error: "This blog has no body text to generate questions from." }, HTTP_STATUS.BAD_REQUEST);
  }
  return { title, sections, locale };
}

/** Question texts already in the quiz. */
async function existingQuestions(config: ManagementConfig, quizId: string | undefined, locale: string): Promise<string[]> {
  if (!quizId) { return []; }
  const quiz = await contentfulRequest(config, `/entries/${encodeURIComponent(quizId)}`);
  const links = (field(quiz, "questionEntries", locale) as Link[] | undefined) ?? [];
  const ids = links.map((link) => link.sys?.id).filter((id): id is string => Boolean(id));
  if (!ids.length) { return []; }
  const { items } = await contentfulRequest<{ items: ManagedEntry[] }>(
    config,
    `/entries?sys.id[in]=${ids.map(encodeURIComponent).join(",")}&limit=${ids.length}`,
  );
  return items.map((item) => plain(field(item, "questionText", locale) as TextNode | undefined)).filter(Boolean);
}

export async function POST(req: Request) {
  const raw = await readSignedBody(req);
  if (raw instanceof Response) { return raw; }
  const request = parseBody(raw);
  if (request instanceof Response) { return request; }

  try {
    const config = getManagementConfig();
    const blog = await loadBlog(config, request.blogId);
    if (blog instanceof Response) { return blog; }
    const existing = await existingQuestions(config, request.quizId, blog.locale);
    const { questions, dropped } = await generateQuestions({ title: blog.title, sections: blog.sections, existing, count: request.count });
    if (!questions.length) {
      return appReply({ error: "No question passed the checks. Try generating again.", dropped }, APP_STATUS.BAD_GATEWAY);
    }
    return appReply({ questions, dropped, existingCount: existing.length }, HTTP_STATUS.OK);
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    return appReply({ error: error instanceof Error ? error.message : "Unknown server error." }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
