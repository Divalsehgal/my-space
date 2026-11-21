import { useEffect, useMemo, useState } from 'react';
import { Button, Note, Stack, Textarea } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { SidebarAppSDK } from '@contentful/app-sdk';
import type { Signer } from './api/createQuizQuestions';
import type { GeneratedQuestion } from './api/generateQuizQuestions';
import { GenerateControls } from './components/GenerateControls';
import { Intro } from './components/Intro';
import { PreviewList } from './components/PreviewList';
import { importQuiz, linkedQuizId, type QuizField } from './importQuiz';

const sampleJson = `{
  "questions": [
    {
      "questionText": "What is the capital of France?",
      "options": [
        { "text": "Berlin", "isCorrect": false },
        { "text": "Paris", "isCorrect": true },
        { "text": "Rome", "isCorrect": false },
        { "text": "Madrid", "isCorrect": false }
      ],
      "explanation": "Paris is the capital city of France.",
      "difficulty": "easy"
    }
  ]
}`;

/** The JSON box is shorter on a blog, where questions are usually drafted rather than pasted. */
const BLOG_JSON_ROWS = 8;
const QUIZ_JSON_ROWS = 18;

const toJson = (questions: GeneratedQuestion[]) => JSON.stringify({ questions }, null, 2);

/** Questions in the JSON box, or none while it isn't valid quiz JSON. */
function readQuestions(json: string): GeneratedQuestion[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed?.questions) ? parsed.questions : [];
  } catch {
    return [];
  }
}

const importLabel = (count: number) => (count ? `Import ${count} question${count === 1 ? '' : 's'}` : 'Import questions');

/** Which entry the sidebar is open on. */
function useEntry() {
  const sdk = useSDK<SidebarAppSDK>();
  const isBlog = sdk.ids.contentType === 'blogPage';
  const quizField: QuizField | undefined = isBlog ? sdk.entry?.fields?.quiz : undefined;
  const sign: Signer = async (request) =>
    (await sdk.cma.appSignedRequest.create({ appDefinitionId: sdk.ids.app ?? '' }, request)).additionalHeaders;
  return { sdk, entryId: sdk.ids.entry || null, isBlog, isQuiz: sdk.ids.contentType === 'quizComponent', quizField, sign };
}

function App() {
  const { sdk, entryId, isBlog, isQuiz, quizField, sign } = useEntry();

  const [jsonInput, setJsonInput] = useState(isBlog ? '' : sampleJson);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [publishAfterImport, setPublishAfterImport] = useState(true);
  const [hasQuiz, setHasQuiz] = useState(() => Boolean(linkedQuizId(quizField)));

  useEffect(() => {
    sdk.window.startAutoResizer();
  }, [sdk]);

  const preview = useMemo(() => readQuestions(jsonInput), [jsonInput]);
  const removeQuestion = (index: number) => setJsonInput(toJson(preview.filter((_, at) => at !== index)));

  const handleImport = async () => {
    if (!entryId) {
      setError('No Contentful entry selected.');
      return;
    }
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      setSuccess(await importQuiz({ entryId, quizField, json: jsonInput, publish: publishAfterImport, sign }));
      setHasQuiz(Boolean(linkedQuizId(quizField)));
      if (isBlog) { setJsonInput(''); }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error creating questions.');
    } finally {
      setIsSaving(false);
    }
  };

  const canImport = Boolean(entryId) && (isBlog || isQuiz) && !isSaving && preview.length > 0;

  return (
    <Stack flexDirection="column" alignItems="stretch" spacing="spacingM" padding="spacingM">
      <Intro isBlog={isBlog} isQuiz={isQuiz} />

      {isBlog && entryId && (
        <GenerateControls blogId={entryId} hasQuiz={hasQuiz} sign={sign} onGenerated={(result) => setJsonInput(toJson(result.questions))} />
      )}

      <Textarea
        value={jsonInput}
        onChange={(event) => setJsonInput(event.target.value)}
        rows={isBlog ? BLOG_JSON_ROWS : QUIZ_JSON_ROWS}
        placeholder='Paste { "questions": [...] } here'
        aria-label="Quiz JSON input"
      />

      <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input type="checkbox" checked={publishAfterImport} onChange={(event) => setPublishAfterImport(event.target.checked)} />
        <span>Publish the options, questions and quiz after import</span>
      </label>

      <Button variant="primary" isFullWidth isDisabled={!canImport} onClick={handleImport}>
        {isSaving ? 'Importing…' : importLabel(preview.length)}
      </Button>

      {error && <Note variant="negative">{error}</Note>}
      {success && <Note variant="positive">{success}</Note>}

      <PreviewList questions={preview} onRemove={removeQuestion} />
    </Stack>
  );
}

export default App;
