import type { ContentfulQuiz, ContentfulRichText } from '@/types';
import type { Translate } from '@/i18n/core';

export type BlogQuizProps = {
  quiz: ContentfulQuiz;
};

export interface QuizTierInfo {
  badge: string;
  title: string;
  desc: string;
  color: string;
  bgColor: string;
}

export function plainText(richText?: ContentfulRichText | string | null): string {
  if (!richText) {
    return '';
  }
  if (typeof richText === 'string') {
    return richText;
  }

  const read = (node: unknown): string => {
    if (!node || typeof node !== 'object') {
      return '';
    }
    const val = node as { value?: string; content?: unknown[] };
    return val.value || (val.content || []).map(read).join(' ');
  };

  return read(richText.json).replace(/\s+/g, ' ').trim();
}

// Tier colours are feedback tokens (CSS vars) so they follow the site theme.
const TIERS = [
  { min: 100, id: "perfect", tone: "success" },
  { min: 75, id: "strong", tone: "info" },
  { min: 50, id: "good", tone: "warning" },
  { min: 0, id: "retry", tone: "error" },
] as const;

export function getTierInfo(percentage: number, t: Translate): QuizTierInfo {
  const tier = TIERS.find(({ min }) => percentage >= min) ?? TIERS[TIERS.length - 1];
  return {
    badge: t(`quiz.tier.${tier.id}.badge`),
    title: t(`quiz.tier.${tier.id}.title`),
    desc: t(`quiz.tier.${tier.id}.desc`),
    color: `var(--t-colors-feedback-${tier.tone}-text)`,
    bgColor: `var(--t-colors-feedback-${tier.tone}-surface)`,
  };
}
