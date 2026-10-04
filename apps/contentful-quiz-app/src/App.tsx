import { useEffect, useMemo, useState } from 'react';
import { Button, Heading, Paragraph, Textarea } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { SidebarAppSDK } from '@contentful/app-sdk';
import { optionLetter, parseQuizPayload, type QuizQuestion } from '@dival-sehgal/quiz/validate';
import { createQuizQuestions } from './api/createQuizQuestions';

const defaultJson = `{
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

function App() {
  const sdk = useSDK<SidebarAppSDK>();
  const [jsonInput, setJsonInput] = useState(defaultJson);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [isQuizEntry, setIsQuizEntry] = useState(false);
  const [publishAfterImport, setPublishAfterImport] = useState(true);

  useEffect(() => {
    setEntryId(sdk.ids.entry || null);
    setIsQuizEntry(sdk.ids.contentType === 'quizComponent');
    sdk.window.startAutoResizer();
  }, [sdk]);

  const parsedPreview = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed || !Array.isArray(parsed.questions)) {
        return [] as QuizQuestion[];
      }
      return parsed.questions as QuizQuestion[];
    } catch {
      return [] as QuizQuestion[];
    }
  }, [jsonInput]);

  const handleCreateQuestions = async () => {
    if (!entryId) {
      setError('No Contentful entry selected.');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setIsSaving(true);

      const payload = parseQuizPayload(jsonInput);
      const message = await createQuizQuestions(entryId, payload, publishAfterImport);

      setSuccess(message || `Created ${payload.questions.length} question(s) successfully. Publish the quiz and its new entries when ready.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error creating questions.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '16px', display: 'grid', gap: '16px',height:"100%" }}>
      <Heading>Quiz builder</Heading>
      <Paragraph>Paste your questions below. Each question needs four unique options, one correct answer, and an explanation.</Paragraph>

      {!isQuizEntry && (
        <div style={{ color: '#8a6100', background: '#fff8e1', padding: '12px', borderRadius: '8px' }}>
          Open this app from a <strong>Component - Quiz</strong> entry to import questions.
        </div>
      )}

      <Textarea
        value={jsonInput}
        onChange={(event) => setJsonInput(event.target.value)}
        rows={18}
        aria-label="Quiz JSON input"
      />

      <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={publishAfterImport}
          onChange={(event) => setPublishAfterImport(event.target.checked)}
        />
        <span>Publish the options, questions, and this quiz after import</span>
      </label>

      <Button variant="primary" isDisabled={!entryId || !isQuizEntry || isSaving} onClick={handleCreateQuestions}>
        {isSaving ? 'Importing...' : 'Import questions'}
      </Button>

      {error && (
        <div style={{ color: '#d32f2f', background: '#fdecea', padding: '12px', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ color: '#1b5e20', background: '#e8f5e9', padding: '12px', borderRadius: '8px' }}>
          {success}
        </div>
      )}

      {parsedPreview.length > 0 && (
        <div>
          <Heading>Import preview ({parsedPreview.length} question{parsedPreview.length === 1 ? '' : 's'})</Heading>
          {parsedPreview.map((question, index) => (
            <div key={`${question.questionText}-${index}`} style={{ marginTop: '12px', padding: '12px', border: '1px solid #dfe3e8', borderRadius: '8px' }}>
              <strong>{index + 1}. {question.questionText}</strong>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                {question.options.map((option, optionIndex) => (
                  <li key={`${option.text}-${optionIndex}`}>
                    {optionLetter(optionIndex)}. {option.text} {option.isCorrect ? '(correct)' : ''}
                  </li>
                ))}
              </ul>
              <p style={{ marginBottom: 0 }}><strong>Explanation:</strong> {question.explanation || 'Missing explanation'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
