import { Heading, Stack } from '@contentful/f36-components';
import type { GeneratedQuestion } from '../api/generateQuizQuestions';
import { QuestionPreview } from './QuestionPreview';

/** The questions that will be imported, each removable. */
export function PreviewList({ questions, onRemove }: { questions: GeneratedQuestion[]; onRemove: (index: number) => void }) {
  if (!questions.length) { return null; }
  return (
    <Stack flexDirection="column" alignItems="stretch" spacing="spacingS">
      <Heading as="h3" marginBottom="none">
        Import preview ({questions.length} question{questions.length === 1 ? '' : 's'})
      </Heading>
      {questions.map((question, index) => (
        <QuestionPreview key={`${question.questionText}-${index}`} question={question} number={index + 1} onRemove={() => onRemove(index)} />
      ))}
    </Stack>
  );
}
