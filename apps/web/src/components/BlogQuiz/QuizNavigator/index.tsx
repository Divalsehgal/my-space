import styles from './styles.module.scss';

interface QuizNavigatorProps {
  answers: Record<string, string>;
  submitted: boolean;
  score: number;
  totalQuestions: number;
  percentage: number;
  tierColor: string;
}

export default function QuizNavigator({
  answers,
  submitted,
  score,
  totalQuestions,
  percentage,
  tierColor,
}: Readonly<QuizNavigatorProps>) {
  const answeredCount = Object.keys(answers).length;
  const progressPercent = submitted
    ? percentage
    : (answeredCount / totalQuestions) * 100;

  return (
    <div className={styles.navigatorStrip} aria-label="Quiz progress">
      <div className={styles.navHeader}>
        <div className={styles.navLabel}>
          <span>📋</span>
          <span>Quiz Progress</span>
        </div>
        <span className={styles.navCount}>
          {submitted
            ? `${score} of ${totalQuestions} Correct (${percentage}%)`
            : `${answeredCount} of ${totalQuestions} Answered`}
        </span>
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
