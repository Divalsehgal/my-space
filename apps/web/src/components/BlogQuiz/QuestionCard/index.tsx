import { motion, AnimatePresence } from 'framer-motion';
import type { ContentfulQuizQuestion } from '@/types';
import { plainText } from '../types';
import styles from './styles.module.scss';
import { useT } from "@/i18n/client";
import type { Translate } from "@/i18n/core";
import { padNumber } from "@dival-sehgal/utils/string";
import QuestionOptions from "./QuestionOptions";

interface QuestionCardProps {
  question: ContentfulQuizQuestion;
  index: number;
  isOpen: boolean;
  selectedOptionId: string | undefined;
  submitted: boolean;
  onToggle: () => void;
  onSelectOption: (optionId: string) => void;
}

function getCardClass(submitted: boolean, isCorrect: boolean): string {
  let cardClass = styles.questionCard;
  if (submitted) {
    cardClass += isCorrect
      ? ` ${styles.questionCardCorrect}`
      : ` ${styles.questionCardIncorrect}`;
  }
  return cardClass;
}

function renderStatusIndicator(t: Translate, submitted: boolean, isCorrect: boolean, isAnswered: boolean) {
  if (submitted) {
    const statusClass = `${styles.statusIndicator} ${
      isCorrect ? styles.statusCorrect : styles.statusIncorrect
    }`;
    return (
      <span className={statusClass}>
        {t(isCorrect ? "quiz.status.correct" : "quiz.status.incorrect")}
      </span>
    );
  }

  const statusClass = `${styles.statusIndicator} ${
    isAnswered ? styles.statusAnswered : styles.statusUnanswered
  }`;
  return (
    <span className={statusClass}>
      {t(isAnswered ? "quiz.status.answered" : "quiz.status.pending")}
    </span>
  );
}

export default function QuestionCard({
  question,
  index,
  isOpen,
  selectedOptionId,
  submitted,
  onToggle,
  onSelectOption,
}: Readonly<QuestionCardProps>) {
  const t = useT();
  const isAnswered = Boolean(selectedOptionId);
  const isCorrect = selectedOptionId === question.correctAnswerId;
  const questionPrompt = plainText(question.questionText);
  const cardClass = getCardClass(submitted, isCorrect);

  return (
    <article
      id={`quiz-question-${question.id}`}
      className={cardClass}
    >
      {/* Accordion Trigger Header */}
      <button
        type="button"
        className={styles.accordionButton}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`question-content-${question.id}`}
      >
        <div className={styles.accordionHeaderLeft}>
          <span className={styles.questionNumberTag}>
            {padNumber(index + 1)}
          </span>
          <span className={styles.questionPromptSnippet}>
            {questionPrompt}
          </span>
        </div>

        <div className={styles.accordionHeaderRight}>
          {renderStatusIndicator(t, submitted, isCorrect, isAnswered)}
          <span
            className={`${styles.chevronIcon} ${
              isOpen ? styles.chevronIconRotated : ''
            }`}
            aria-hidden="true"
          >
            ▼
          </span>
        </div>
      </button>

      {/* Accordion Content Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`question-content-${question.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className={styles.accordionBody}>
              <QuestionOptions
                question={question}
                index={index}
                selectedOptionId={selectedOptionId}
                submitted={submitted}
                isCorrect={isCorrect}
                onSelectOption={onSelectOption}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
