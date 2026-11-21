import { useState } from 'react';
import { Button, Note, Select, Spinner, Stack, Text } from '@contentful/f36-components';
import { generateQuizQuestions, type GenerateResult } from '../api/generateQuizQuestions';
import type { Signer } from '../api/signedPost';

const COUNTS = ['4', '6', '8', '10'];
const DEFAULT_COUNT = '6';

interface Props {
  blogId: string;
  hasQuiz: boolean;
  sign: Signer;
  onGenerated: (result: GenerateResult) => void;
}

/** Blog Page mode: what will happen to the quiz, and the "draft questions from this post" control. */
export function GenerateControls({ blogId, hasQuiz, sign, onGenerated }: Props) {
  const [count, setCount] = useState(DEFAULT_COUNT);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const generate = async () => {
    setError(null);
    setSummary(null);
    setIsGenerating(true);
    try {
      const result = await generateQuizQuestions(blogId, Number(count), sign);
      onGenerated(result);
      const dropped = result.dropped ? `, ${result.dropped} dropped by the checks` : '';
      setSummary(`Drafted ${result.questions.length} question(s)${dropped}. Review, edit or remove them below, then import.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error generating questions.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Stack flexDirection="column" alignItems="stretch" spacing="spacingS">
      <Note variant="neutral">
        {hasQuiz
          ? 'This post has a quiz. Imported questions are added to it, and drafts skip questions it already has.'
          : 'This post has no quiz yet. Importing creates one and links it to this post.'}
      </Note>
      <Stack spacing="spacingS">
        <Select
          aria-label="Number of questions"
          value={count}
          onChange={(event) => setCount(event.target.value)}
          isDisabled={isGenerating}
        >
          {COUNTS.map((value) => (
            <Select.Option key={value} value={value}>{value} questions</Select.Option>
          ))}
        </Select>
        <Button variant="secondary" onClick={generate} isDisabled={isGenerating}>
          {isGenerating ? 'Drafting…' : 'Draft from this post'}
        </Button>
      </Stack>
      {isGenerating && (
        <Stack spacing="spacingXs">
          <Spinner size="small" />
          <Text fontColor="gray600">Gemini is reading the post. This usually takes 10–60 seconds.</Text>
        </Stack>
      )}
      {summary && <Note variant="positive">{summary}</Note>}
      {error && <Note variant="negative">{error}</Note>}
    </Stack>
  );
}
