import { HTTP_STATUS } from './http.js';

/** What to tell the editor when some questions were created but not all, or the quiz didn't publish. */
function recoveryHint({ createdQuestionIds, failure, quizPublishError }) {
  if (createdQuestionIds.length === 0) {return 'No questions were created. Re-run the import.';}
  const outcome = quizPublishError
    ? ' and saved to the quiz in draft (quiz publish failed - open the quiz entry in Contentful and publish it manually, or re-run once the connection issue clears)'
    : ', attached, and published successfully';
  const next = failure ? ` Re-run the import with only the remaining question(s) from question ${failure.questionIndex + 1} onward.` : '';
  return `The first ${createdQuestionIds.length} question(s) were created${outcome}.${next}`;
}

/** Status code and JSON body for an import result. */
export function importResponse(result, { total, publish }) {
  const { createdQuestionIds, failure, quizPublishError } = result;
  if (!failure && !quizPublishError) {
    return {
      status: HTTP_STATUS.CREATED,
      body: {
        success: true,
        createdQuestionIds,
        published: publish,
        message: `Created, attached, and ${publish ? 'published' : 'saved'} ${createdQuestionIds.length} question(s).`,
      },
    };
  }
  const messages = [
    failure && `Failed while creating question ${failure.questionIndex + 1} of ${total}: ${failure.message}`,
    quizPublishError && `Failed to publish the quiz after attaching questions: ${quizPublishError}`,
  ].filter(Boolean);
  return {
    status: HTTP_STATUS.BAD_GATEWAY,
    body: { error: messages.join(' '), createdQuestionIds, hint: recoveryHint(result) },
  };
}
