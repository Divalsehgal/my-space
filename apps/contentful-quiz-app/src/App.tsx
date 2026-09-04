import { useEffect, useMemo, useState } from 'react';
import { Button, Heading, Paragraph, Textarea } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { SidebarAppSDK } from '@contentful/app-sdk';

interface QuizOption {
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  questionText: string;
  options: QuizOption[];
  explanation: string;
}

interface QuizJsonPayload {
  questions: QuizQuestion[];
}

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

  const validatePayload = (raw: string): QuizJsonPayload => {
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.questions)) {
      throw new Error('Payload must be an object with a top-level "questions" array.');
    }

    const questions = parsed.questions as QuizQuestion[];

    if (questions.length === 0) {
      throw new Error('At least one question is required.');
    }

    questions.forEach((question, index) => {
      if (!question.questionText || typeof question.questionText !== 'string') {
        throw new Error(`Question ${index + 1} is missing a valid questionText.`);
      }

      if (!question.explanation || typeof question.explanation !== 'string') {
        throw new Error(`Question ${index + 1} is missing a valid explanation.`);
      }

      if (!Array.isArray(question.options) || question.options.length !== 4) {
        throw new Error(`Question ${index + 1} must contain exactly 4 options.`);
      }

      if (question.options.some((option) => !option || !option.text || typeof option.text !== 'string')) {
        throw new Error(`Question ${index + 1} contains an empty option.`);
      }

      const correctCount = question.options.filter((option) => option.isCorrect === true).length;
      if (correctCount !== 1) {
        throw new Error(`Question ${index + 1} must have exactly one correct option.`);
      }

      const normalized = question.options.map((option) => option.text.trim().toLowerCase());
      if (new Set(normalized).size !== normalized.length) {
        throw new Error(`Question ${index + 1} contains duplicate option text.`);
      }
    });

    return parsed as QuizJsonPayload;
  };

  const handleCreateQuestions = async () => {
    if (!entryId) {
      setError('No Contentful entry selected.');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setIsSaving(true);

      const payload = validatePayload(jsonInput);

      // Use environment variable for backend URL, default to /api for local dev
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '/api';
      const endpoint = `${backendUrl}/contentful/create-quiz-questions`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: entryId,
          questions: payload.questions.map((question) => ({
            questionText: question.questionText,
            options: question.options,
            explanation: question.explanation,
          })),
          publish: publishAfterImport,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to create quiz questions.';
        
        try {
          if (contentType?.includes('application/json')) {
            const data = await response.json();
            errorMessage = data?.error || data?.details?.[0] || errorMessage;
          } else {
            errorMessage = await response.text();
          }
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Invalid response from server. Please check backend logs.');
      }

      setSuccess(data?.message || `Created ${payload.questions.length} question(s) successfully. Publish the quiz and its new entries when ready.`);
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
        Publish the options, questions, and this quiz after import
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
                    {String.fromCharCode(65 + optionIndex)}. {option.text} {option.isCorrect ? '(correct)' : ''}
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
