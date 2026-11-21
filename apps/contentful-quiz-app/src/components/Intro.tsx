import { Heading, Note, Paragraph } from '@contentful/f36-components';

/** What the sidebar does on this kind of entry. */
export function Intro({ isBlog, isQuiz }: { isBlog: boolean; isQuiz: boolean }) {
  return (
    <>
      <div>
        <Heading marginBottom="spacingXs">Quiz builder</Heading>
        <Paragraph marginBottom="none">
          {isBlog
            ? 'Draft questions from this post, or paste your own. Nothing is saved until you import.'
            : 'Paste your questions below. Each needs four unique options, one correct answer and an explanation.'}
        </Paragraph>
      </div>
      {!isBlog && !isQuiz && (
        <Note variant="warning">Open this app from a <strong>Blog Page</strong> or <strong>Component - Quiz</strong> entry.</Note>
      )}
    </>
  );
}
