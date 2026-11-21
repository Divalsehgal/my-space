import { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Note, Stack, Textarea } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { EditorAppSDK, SidebarAppSDK } from '@contentful/app-sdk';
import type { Signer } from './api/createQuizQuestions';
import type { GeneratedQuestion } from './api/generateQuizQuestions';
import { BlogPicker, useBlogOptions } from './components/BlogPicker';
import { GenerateControls } from './components/GenerateControls';
import { Intro } from './components/Intro';
import { PreviewList } from './components/PreviewList';
import { importQuiz } from './importQuiz';

/** Runs as the quiz entry's "Questions" field editor (which has a resizable window); typed loosely so any entry location works. */
type AppSDK = EditorAppSDK & Partial<Pick<SidebarAppSDK, 'window'>>;

const JSON_ROWS = 10;
const JSON_PLACEHOLDER = `Draft from the blog, or paste:
{ "questions": [ { "questionText": "…", "options": [ { "text": "…", "isCorrect": true }, … ], "explanation": "…" } ] }`;

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

/** The quiz entry the app is open on, and how to sign requests as this app. */
function useQuizEntry() {
  const sdk = useSDK<AppSDK>();
  const sign: Signer = async (request) =>
    (await sdk.cma.appSignedRequest.create({ appDefinitionId: sdk.ids.app ?? '' }, request)).additionalHeaders;
  return { sdk, quizId: sdk.ids.entry, isQuiz: sdk.ids.contentType === 'quizComponent', sign };
}

function App() {
  const { sdk, quizId, isQuiz, sign } = useQuizEntry();
  const { blogs, error: blogError } = useBlogOptions(sdk, quizId);
  const [blogId, setBlogId] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [publishAfterImport, setPublishAfterImport] = useState(true);

  useEffect(() => {
    sdk.window?.startAutoResizer();
  }, [sdk]);

  // A quiz already linked to a blog stays with it.
  useEffect(() => {
    const linked = blogs?.find((blog) => blog.isLinked);
    if (linked) { setBlogId(linked.id); }
  }, [blogs]);

  const preview = useMemo(() => readQuestions(jsonInput), [jsonInput]);
  const removeQuestion = (index: number) => setJsonInput(toJson(preview.filter((_, at) => at !== index)));

  const handleImport = async () => {
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      setSuccess(await importQuiz({ quizId, blogId }, jsonInput, publishAfterImport, sign));
      setJsonInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error creating questions.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isQuiz) { return <Intro isQuiz={false} />; }

  return (
    <Stack flexDirection="column" alignItems="stretch" spacing="spacingM" padding="spacingM" style={{ maxWidth: '760px', margin: '0 auto' }}>
      <Intro isQuiz />
      <BlogPicker blogs={blogs} error={blogError} value={blogId} onChange={setBlogId} isDisabled={isSaving} />
      <GenerateControls blogId={blogId} quizId={quizId} sign={sign} onGenerated={(result) => setJsonInput(toJson(result.questions))} />

      <Textarea
        value={jsonInput}
        onChange={(event) => setJsonInput(event.target.value)}
        rows={JSON_ROWS}
        placeholder={JSON_PLACEHOLDER}
        aria-label="Quiz JSON input"
      />

      <Checkbox isChecked={publishAfterImport} onChange={(event) => setPublishAfterImport(event.target.checked)}>
        Publish the options, questions and quiz after import
      </Checkbox>

      <Button variant="primary" isFullWidth isDisabled={!blogId || isSaving || !preview.length} onClick={handleImport}>
        {isSaving ? 'Importing…' : importLabel(preview.length)}
      </Button>

      {error && <Note variant="negative">{error}</Note>}
      {success && <Note variant="positive">{success}</Note>}

      <PreviewList questions={preview} onRemove={removeQuestion} />
    </Stack>
  );
}

export default App;
