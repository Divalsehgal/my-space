import { motion } from 'framer-motion';
import type { QuizTierInfo } from '../types';
import styles from './styles.module.scss';

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  percentage: number;
  tier: QuizTierInfo;
  onReset: () => void;
  onExpandAll: () => void;
}

export default function QuizResults({
  score,
  totalQuestions,
  percentage,
  tier,
  onReset,
  onExpandAll,
}: Readonly<QuizResultsProps>) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const mistakes = totalQuestions - score;

  return (
    <motion.section
      className={styles.resultsSection}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      aria-live="polite"
    >
      <div className={styles.resultsHeroRow}>
        {/* Circular Animated SVG Mastery Gauge */}
        <div className={styles.radialGaugeWrapper}>
          <svg className={styles.radialGaugeSvg} viewBox="0 0 120 120">
            <circle
              className={styles.radialGaugeTrack}
              cx="60"
              cy="60"
              r={radius}
            />
            <circle
              className={styles.radialGaugeProgress}
              cx="60"
              cy="60"
              r={radius}
              stroke={tier.color}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className={styles.radialGaugeCenter}>
            <span className={styles.percentageBig}>{percentage}%</span>
            <span className={styles.fractionSmall}>
              {score} / {totalQuestions}
            </span>
          </div>
        </div>

        {/* Feedback & Mastery Tier Info */}
        <div className={styles.resultsHeroText}>
          <span
            className={styles.tierPill}
            style={{
              backgroundColor: tier.bgColor,
              color: tier.color,
            }}
          >
            {tier.badge}
          </span>
          <h3 className={styles.resultsHeading}>{tier.title}</h3>
          <p className={styles.resultsDescription}>{tier.desc}</p>
        </div>
      </div>

      {/* 4-Card Performance Breakdown */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricNumber}>{totalQuestions}</div>
          <div className={styles.metricTitle}>Total Questions</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricNumber} style={{ color: '#10b981' }}>
            {score}
          </div>
          <div className={styles.metricTitle}>Correct Answers</div>
        </div>
        <div className={styles.metricCard}>
          <div
            className={styles.metricNumber}
            style={{ color: mistakes > 0 ? '#f43f5e' : 'inherit' }}
          >
            {mistakes}
          </div>
          <div className={styles.metricTitle}>Mistakes</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricNumber} style={{ color: tier.color }}>
            {percentage}%
          </div>
          <div className={styles.metricTitle}>Accuracy Rate</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.resultsActionRow}>
        <button
          type="button"
          className={styles.retakeQuizBtn}
          onClick={onReset}
        >
          <span>↺</span>
          <span>Retake Quiz</span>
        </button>
        <button
          type="button"
          className={styles.reviewAllBtn}
          onClick={onExpandAll}
        >
          <span>📖</span>
          <span>Review All Answers</span>
        </button>
      </div>
    </motion.section>
  );
}
