import { useEffect, useState } from 'react';
import { Select, Text } from '@contentful/f36-components';
import type { EditorAppSDK } from '@contentful/app-sdk';

export interface BlogOption {
  id: string;
  title: string;
  /** Already linked to this quiz. */
  isLinked: boolean;
}

/** Enough to list blogs; any `blogPage` has more. */
const BLOG_LIMIT = 1000;

type BlogEntry = { sys: { id: string }; fields: { title?: Record<string, string>; quiz?: Record<string, { sys?: { id?: string } }> } };

/**
 * Blogs this quiz can belong to: those with no quiz yet, plus the one already
 * linked to this quiz. A blog linked to another quiz never shows, so each blog
 * keeps exactly one quiz.
 */
export function useBlogOptions(sdk: EditorAppSDK, quizId: string) {
  const [blogs, setBlogs] = useState<BlogOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const locale = sdk.locales.default;
    sdk.cma.entry
      .getMany({ query: { content_type: 'blogPage', select: 'sys.id,fields.title,fields.quiz', limit: BLOG_LIMIT } })
      .then(({ items }) => {
        const options = (items as unknown as BlogEntry[])
          .map((item) => ({ item, linkedTo: item.fields.quiz?.[locale]?.sys?.id }))
          .filter(({ linkedTo }) => !linkedTo || linkedTo === quizId)
          .map(({ item, linkedTo }) => ({ id: item.sys.id, title: item.fields.title?.[locale] || 'Untitled blog', isLinked: linkedTo === quizId }))
          .sort((a, b) => Number(b.isLinked) - Number(a.isLinked) || a.title.localeCompare(b.title));
        setBlogs(options);
      })
      .catch(() => setError('Could not load the blog list. Reload the entry to try again.'));
  }, [sdk, quizId]);

  return { blogs, error };
}

interface Props {
  blogs: BlogOption[] | null;
  error: string | null;
  value: string;
  onChange: (blogId: string) => void;
  isDisabled: boolean;
}

/** Which blog the quiz is for. Locked once the quiz is linked to a blog. */
export function BlogPicker({ blogs, error, value, onChange, isDisabled }: Props) {
  if (error) { return <Text fontColor="red600">{error}</Text>; }
  const linked = blogs?.find((blog) => blog.isLinked);
  return (
    <Select
      aria-label="Blog post"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      isDisabled={isDisabled || !blogs || Boolean(linked)}
    >
      <Select.Option value="" isDisabled>{blogs ? 'Choose the blog this quiz is for' : 'Loading blogs…'}</Select.Option>
      {(blogs ?? []).map((blog) => (
        <Select.Option key={blog.id} value={blog.id}>{blog.title}</Select.Option>
      ))}
    </Select>
  );
}
