import styles from './styles.module.scss';
import { useT } from "@/i18n/client";

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
  const t = useT();
  const answeredCount = Object.keys(answers).length;
  const progressPercent = submitted
    ? percentage
    : (answeredCount / totalQuestions) * 100;

  return (
    <div className={styles.navigatorStrip} aria-label={t("quiz.progress")}>
      <div className={styles.navHeader}>
        <div className={styles.navLabel}>
          <span>📋</span>
          <span>{t("quiz.progress")}</span>
        </div>
        <span className={styles.navCount}>
          {submitted
            ? t("quiz.progressScore", { score, total: totalQuestions, percentage })
            : t("quiz.progressAnswered", { answered: answeredCount, total: totalQuestions })}
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
