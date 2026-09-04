import type { ContentfulQuizQuestion } from '@/types';
import styles from './styles.module.scss';

interface QuizNavigatorProps {
  questions: ContentfulQuizQuestion[];
  answers: Record<string, string>;
  openQuestions: Record<number, boolean>;
  submitted: boolean;
  score: number;
  totalQuestions: number;
  percentage: number;
  tierColor: string;
  onJumpToQuestion: (index: number) => void;
}

function getPillStatusClass(
  isCorrect: boolean,
  isAnswered: boolean,
  submitted: boolean,
): string {
  if (submitted) {
    return isCorrect ? styles.navPillCorrect : styles.navPillIncorrect;
  }
  if (isAnswered) {
    return styles.navPillAnswered;
  }
  return '';
}

function getAriaStatusLabel(
  index: number,
  isCorrect: boolean,
  isAnswered: boolean,
  submitted: boolean,
): string {
  if (submitted) {
    const verdict = isCorrect ? 'Correct' : 'Incorrect';
    return `Jump to Question ${index + 1}: ${verdict}`;
  }
  const answerState = isAnswered ? 'Answered' : 'Unanswered';
  return `Jump to Question ${index + 1}: ${answerState}`;
}

function renderPillIcon(
  submitted: boolean,
  isCorrect: boolean,
  isAnswered: boolean,
) {
  if (submitted) {
    return <span>{isCorrect ? '✓' : '✕'}</span>;
  }
  if (isAnswered) {
    return <span>•</span>;
  }
  return null;
}

export default function QuizNavigator({
  questions,
  answers,
  openQuestions,
  submitted,
  score,
  totalQuestions,
  percentage,
  tierColor,
  onJumpToQuestion,
}: Readonly<QuizNavigatorProps>) {
  const answeredCount = Object.keys(answers).length;
  const progressPercent = submitted
    ? percentage
    : (answeredCount / totalQuestions) * 100;

  return (
    <div className={styles.navigatorStrip} aria-label="Quiz table of contents">
      <div className={styles.navHeader}>
        <div className={styles.navLabel}>
          <span>📋</span>
          <span>Quiz Navigator</span>
        </div>
        <span className={styles.navCount}>
          {submitted
            ? `${score} of ${totalQuestions} Correct (${percentage}%)`
            : `${answeredCount} of ${totalQuestions} Answered`}
        </span>
      </div>

      <div className={styles.navGrid} role="navigation" aria-label="Question index">
        {questions.map((question, index) => {
          const isAnswered = Boolean(answers[question.id]);
          const isOpen = Boolean(openQuestions[index]);
          const isCorrect = answers[question.id] === question.correctAnswerId;

          const activeClass = isOpen ? styles.navPillActive : '';
          const statusClass = getPillStatusClass(isCorrect, isAnswered, submitted);
          const fullPillClass = `${styles.navPill} ${activeClass} ${statusClass}`.trim();

          return (
            <button
              key={question.id}
              type="button"
              className={fullPillClass}
              onClick={() => onJumpToQuestion(index)}
              aria-label={getAriaStatusLabel(index, isCorrect, isAnswered, submitted)}
            >
              <span>Q{index + 1}</span>
              {renderPillIcon(submitted, isCorrect, isAnswered)}
            </button>
          );
        })}
      </div>

      <div className={styles.trackBar}>
        <div
          className={styles.trackFill}
          style={{
            width: `${progressPercent}%`,
            background: submitted ? tierColor : undefined,
          }}
        />
      </div>
    </div>
  );
}
