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
  };
}

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
