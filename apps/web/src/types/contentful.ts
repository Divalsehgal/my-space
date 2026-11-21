import type { Document, Node } from '@contentful/rich-text-types';

export interface ContentfulAsset {
  sys: { id: string };
  url: string;
  title?: string;
  width?: number;
  height?: number;
}

export interface ContentfulRichText {
  json: Document;
  links?: {
    assets?: {
      block?: ContentfulAsset[];
    };
    entries?: {
      block?: ContentfulEmbeddedEntry[];
    };
  };
}

/** A `blogStep` entry: one slide of a `blogSteps` walkthrough. */
export interface ContentfulStep {
  sys: { id: string };
  title: string;
  body?: ContentfulRichText | null;
}

/** A `blogSteps` entry embedded in a post body; readers page through its steps. */
export interface ContentfulStepsBlock {
  __typename: "BlogSteps";
  sys: { id: string };
  title: string;
  stepsCollection?: { items: (ContentfulStep | null)[] } | null;
}

/** Entries the body can embed; anything else (an unknown type) is skipped. */
export type ContentfulEmbeddedEntry = ContentfulStepsBlock | { __typename: string; sys: { id: string } };

export type ContentfulRichTextNode = Node & {
  nodeType?: string;
  value?: string;
  content?: Node[];
};

export interface ContentfulPost {
  id: string;
  title: string;
  cover: string | null;
  date: string;
  publishedAt?: string;
  slug: string;
  description: string;
  tags: string[];
  content: ContentfulRichText;
  quiz?: ContentfulQuiz | null;
}

export interface ContentfulQuizOption {
  id: string;
  text: ContentfulRichText;
}

export interface ContentfulQuizQuestion {
  id: string;
  questionText: ContentfulRichText;
  explanation: ContentfulRichText;
  correctAnswerId: string;
  options: ContentfulQuizOption[];
}

export interface ContentfulQuiz {
  id: string;
  title: string;
  questions: ContentfulQuizQuestion[];
}
