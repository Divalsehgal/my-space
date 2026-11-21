import { useState } from 'react';
import { Button, Note, Select, Spinner, Stack, Text } from '@contentful/f36-components';
import { generateQuizQuestions, type GenerateResult } from '../api/generateQuizQuestions';
import type { Signer } from '../api/signedPost';

const COUNTS = ['4', '6', '8', '10'];
const DEFAULT_COUNT = '6';

interface Props {
  blogId: string;
  quizId: string;
  sign: Signer;
  onGenerated: (result: GenerateResult) => void;
}

/** "Draft questions from the blog" with Gemini; available once a blog is chosen. */
export function GenerateControls({ blogId, quizId, sign, onGenerated }: Props) {
  const [count, setCount] = useState(DEFAULT_COUNT);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const generate = async () => {
    setError(null);
    setSummary(null);
    setIsGenerating(true);
    try {
      const result = await generateQuizQuestions(blogId, quizId, Number(count), sign);
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
      {/* Stacked: the sidebar is under 300px wide, too narrow for both side by side. */}
      <Stack flexDirection="column" alignItems="stretch" spacing="spacingXs">
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
        <Button variant="secondary" isFullWidth onClick={generate} isDisabled={isGenerating || !blogId}>
          {isGenerating ? 'Drafting…' : 'Draft from the blog'}
        </Button>
      </Stack>
      {isGenerating && (
        <Stack spacing="spacingXs">
          <Spinner size="small" />
          <Text fontColor="gray600">Gemini is reading the blog. This usually takes 10–60 seconds.</Text>
        </Stack>
      )}
      {summary && <Note variant="positive">{summary}</Note>}
      {error && <Note variant="negative">{error}</Note>}
    </Stack>
  );
}
