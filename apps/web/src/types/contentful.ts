import { Document } from '@contentful/rich-text-types';

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

export interface ContentfulPost {
  id: string;
  title: string;
  cover: string | null;
  date: string;
  slug: string;
  description: string;
  tags: string[];
  content: ContentfulRichText;
}
