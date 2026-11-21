import { Badge, Button, Card, Stack, Text } from '@contentful/f36-components';
import { optionLetter } from '@dival-sehgal/quiz/validate';
import type { GeneratedQuestion } from '../api/generateQuizQuestions';

interface Props {
  question: GeneratedQuestion;
  number: number;
  onRemove: () => void;
}

/** One question as the reader will see it, plus where in the post it came from when it was generated. */
export function QuestionPreview({ question, number, onRemove }: Props) {
  return (
    <Card padding="default">
      <Stack flexDirection="column" alignItems="stretch" spacing="spacingS">
        <Stack justifyContent="space-between" alignItems="flex-start">
          <Text fontWeight="fontWeightDemiBold">
            {number}. {question.questionText}
          </Text>
          <Button size="small" variant="transparent" onClick={onRemove} aria-label={`Remove question ${number}`}>
            Remove
          </Button>
        </Stack>
        <ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: '4px' }}>
          {(question.options ?? []).map((option, index) => (
            <li key={`${option.text}-${index}`}>
              <Text fontColor={option.isCorrect ? 'green600' : 'gray700'}>
                {optionLetter(index)}. {option.text}
              </Text>{' '}
              {option.isCorrect && <Badge variant="positive">correct</Badge>}
            </li>
          ))}
        </ol>
        <Text fontColor="gray700">
          <strong>Why:</strong> {question.explanation || 'Missing explanation'}
        </Text>
        {question.sourceQuote && (
          <blockquote style={{ margin: 0, paddingLeft: '12px', borderLeft: '3px solid currentColor', opacity: 0.8 }}>
            <Text fontColor="gray600" as="p">“{question.sourceQuote}”</Text>
            {question.section && <Badge variant="secondary">{question.section}</Badge>}
          </blockquote>
        )}
      </Stack>
    </Card>
  );
}
