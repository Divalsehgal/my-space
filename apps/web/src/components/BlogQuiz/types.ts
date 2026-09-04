import type { ContentfulQuiz, ContentfulRichText } from '@/types';

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

export function getTierInfo(percentage: number): QuizTierInfo {
  if (percentage === 100) {
    return {
      badge: '🏆 Flawless Mastery',
      title: 'Outstanding! Perfect score!',
      desc: 'You answered every question accurately. You have mastered these concepts thoroughly.',
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.15)',
    };
  }
  if (percentage >= 75) {
    return {
      badge: '🌟 Advanced Practitioner',
      title: 'Great job! Strong foundation!',
      desc: 'You demonstrated a solid command of the material with only minor gaps.',
      color: '#6366f1',
      bgColor: 'rgba(99, 102, 241, 0.15)',
    };
  }
  if (percentage >= 50) {
    return {
      badge: '💡 Good Effort',
      title: 'Good start — Keep learning!',
      desc: 'You got some key points right. Review the answer explanations below to strengthen your understanding.',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.15)',
    };
  }
  return {
    badge: '📖 Knowledge Builder',
    title: 'Review & try again',
    desc: 'Take some time to explore the detailed answers below and retake the quiz to level up your knowledge.',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  };
}
