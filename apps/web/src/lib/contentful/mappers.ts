import type { ContentfulPost, ContentfulQuiz, ContentfulRichText } from '@/types/contentful';

/** Search engines truncate descriptions around 155 characters. */
const DESCRIPTION_MAX_LENGTH = 155;

/**
 * Raw item structure from Contentful GraphQL API
 */
export interface ContentfulPostItem {
  sys: {
    id: string;
    firstPublishedAt: string;
    publishedAt?: string;
  };
  title: string;
  slug: string;
  excerpt?: string;
  body: ContentfulRichText;
  quiz?: {
    sys: { id: string };
    title: string;
    questionEntriesCollection?: {
      items: Array<{
        sys: { id: string };
        questionText: ContentfulRichText;
        explanation: ContentfulRichText;
        correctAnswer: { sys: { id: string } };
        optionsCollection?: {
          items: Array<{ sys: { id: string }; text: ContentfulRichText } | null>;
        };
      } | null>;
    };
  } | null;
}

/**
 * Mapping function to convert Contentful data to our shared Blog Post format
 */
export function mapContentfulPost(item: ContentfulPostItem): ContentfulPost {
  return {
    id: item.sys.id,
    title: item.title,
    // BlogPage does not define a cover-image field in the Contentful model.
    cover: null,
    date: item.sys.firstPublishedAt,
    publishedAt: item.sys.publishedAt,
    slug: item.slug,
    description: getPostDescription(item.body),
    tags: [],
    content: item.body,
    quiz: mapContentfulQuiz(item.quiz),
  };
}

function mapContentfulQuiz(quiz?: ContentfulPostItem['quiz']): ContentfulQuiz | null {
  if (!quiz) {
    return null;
  }

  return {
    id: quiz.sys.id,
    title: quiz.title,
    questions: (quiz.questionEntriesCollection?.items || []).flatMap((question) => {
      if (!question?.questionText || !question.explanation || !question.correctAnswer) {
        return [];
      }
      return [{
        id: question.sys.id,
        questionText: question.questionText,
        explanation: question.explanation,
        correctAnswerId: question.correctAnswer.sys.id,
        options: (question.optionsCollection?.items || []).flatMap((option) => option ? [{
          id: option.sys.id,
          text: option.text,
        }] : []),
      }];
    }),
  };
}

export interface ContentfulCollectionResponse<T> {
  blogPageCollection: {
    items: T[];
  };
}

function getPostDescription(body?: ContentfulRichText): string {
  if (!body?.json?.content) {
    return "";
  }

  interface RichTextNode {
    nodeType: string;
    value?: string;
    content?: RichTextNode[];
  }

  const extractText = (nodes: RichTextNode[]): string =>
    nodes
      .map((node) => (node.nodeType === "text" ? node.value || "" : extractText(node.content || [])))
      .join("");

  // Each block (paragraph, heading, list item) becomes its own sentence so the
  // snippet reads naturally instead of running list items together.
  const blocks: string[] = [];
  const collectBlocks = (nodes: RichTextNode[]) => {
    for (const node of nodes) {
      if (node.nodeType === "paragraph" || node.nodeType.startsWith("heading")) {
        const text = extractText(node.content || []).replace(/\s+/g, " ").trim();
        if (text) {blocks.push(/[.!?:]$/.test(text) ? text : `${text}.`);}
      } else if (node.content) {
        collectBlocks(node.content);
      }
    }
  };
  collectBlocks(body.json.content as unknown as RichTextNode[]);

  const text = blocks.join(" ");
  const maxLength = DESCRIPTION_MAX_LENGTH;
  if (text.length <= maxLength) {
    return text;
  }
  const cut = text.slice(0, maxLength);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.]$/, "")}…`;
}
