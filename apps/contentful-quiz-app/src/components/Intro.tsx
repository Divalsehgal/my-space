import { Heading, Note, Paragraph } from '@contentful/f36-components';

/** What the app does, or where to open it instead. */
export function Intro({ isQuiz }: { isQuiz: boolean }) {
  if (!isQuiz) {
    return <Note variant="warning">Open this app from a <strong>Component - Quiz</strong> entry.</Note>;
  }
  return (
    <div>
      <Heading marginBottom="spacingXs">Quiz builder</Heading>
      <Paragraph marginBottom="none">
        Choose the blog this quiz is for, then draft questions from it or paste your own. Nothing is saved until you
        import; importing also links the blog to this quiz.
      </Paragraph>
    </div>
  );
}
