import { motion, AnimatePresence } from 'framer-motion';
import type { ContentfulQuizQuestion } from '@/types';
import { plainText } from '../types';
import styles from './styles.module.scss';

interface QuestionCardProps {
  question: ContentfulQuizQuestion;
  index: number;
  totalQuestions: number;
  isOpen: boolean;
  selectedOptionId: string | undefined;
  submitted: boolean;
  onToggle: () => void;
  onSelectOption: (optionId: string) => void;
  onJumpToQuestion: (index: number) => void;
}

function getCardClass(isOpen: boolean, submitted: boolean, isCorrect: boolean): string {
  let cardClass = styles.questionCard;
  if (isOpen) {
    cardClass += ` ${styles.questionCardActive}`;
  }
  if (submitted) {
    cardClass += isCorrect
      ? ` ${styles.questionCardCorrect}`
      : ` ${styles.questionCardIncorrect}`;
  }
  return cardClass;
}

function getOptionClass(
  isOptionSelected: boolean,
  isOptionCorrect: boolean,
  submitted: boolean,
): string {
  let optionClass = styles.optionTile;
  if (isOptionSelected) {
    optionClass += ` ${styles.optionTileSelected}`;
  }
  if (submitted) {
    optionClass += ` ${styles.optionTileDisabled}`;
    if (isOptionCorrect) {
      optionClass += ` ${styles.optionTileCorrect}`;
    } else if (isOptionSelected) {
      optionClass += ` ${styles.optionTileIncorrect}`;
    }
  }
  return optionClass;
}

function renderStatusIndicator(submitted: boolean, isCorrect: boolean, isAnswered: boolean) {
  if (submitted) {
    const statusClass = `${styles.statusIndicator} ${
      isCorrect ? styles.statusCorrect : styles.statusIncorrect
    }`;
    return (
      <span className={statusClass}>
        {isCorrect ? '✓ Correct' : '✕ Incorrect'}
      </span>
    );
  }

  const statusClass = `${styles.statusIndicator} ${
    isAnswered ? styles.statusAnswered : styles.statusUnanswered
  }`;
  return (
    <span className={statusClass}>
      {isAnswered ? 'Answered' : 'Pending'}
    </span>
  );
}

export default function QuestionCard({
  question,
  index,
  totalQuestions,
  isOpen,
  selectedOptionId,
  submitted,
  onToggle,
  onSelectOption,
  onJumpToQuestion,
}: Readonly<QuestionCardProps>) {
  const isAnswered = Boolean(selectedOptionId);
  const isCorrect = selectedOptionId === question.correctAnswerId;
  const questionPrompt = plainText(question.questionText);
  const cardClass = getCardClass(isOpen, submitted, isCorrect);

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
            {index < 9 ? `0${index + 1}` : index + 1}
          </span>
          <span className={styles.questionPromptSnippet}>
            {questionPrompt}
          </span>
        </div>

        <div className={styles.accordionHeaderRight}>
          {renderStatusIndicator(submitted, isCorrect, isAnswered)}
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
              <p className={styles.fullPromptText}>{questionPrompt}</p>

              {/* Vertical Stack of Options */}
              <div
                className={styles.optionsGroup}
                role="radiogroup"
                aria-label={`Options for Question ${index + 1}`}
              >
                {question.options.map((option, optionIndex) => {
                  const isOptionSelected = selectedOptionId === option.id;
                  const isOptionCorrect = option.id === question.correctAnswerId;
                  const optionClass = getOptionClass(
                    isOptionSelected,
                    isOptionCorrect,
                    submitted,
                  );
                  const optionLetter = String.fromCharCode(65 + optionIndex);

                  return (
                    <label
                      key={option.id}
                      className={optionClass}
                      onClick={() => onSelectOption(option.id)}
                    >
                      <input
                        type="radio"
                        className={styles.hiddenRadioInput}
                        name={`quiz-question-${question.id}`}
                        value={option.id}
                        checked={isOptionSelected}
                        disabled={submitted}
                        onChange={() => onSelectOption(option.id)}
                      />
                      <span className={styles.optionLetterBadge}>
                        {optionLetter}
                      </span>
                      <span className={styles.optionContentText}>
                        {plainText(option.text)}
                      </span>

                      {submitted && isOptionCorrect && (
                        <span className={`${styles.verdictBadge} ${styles.verdictCorrect}`}>
                          Correct Choice ✓
                        </span>
                      )}
                      {submitted && isOptionSelected && !isOptionCorrect && (
                        <span className={`${styles.verdictBadge} ${styles.verdictIncorrect}`}>
                          Your Choice ✕
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Post-submission Explanation Callout */}
              {submitted && (
                <div
                  className={`${styles.explanationCard} ${
                    isCorrect
                      ? styles.explanationCorrect
                      : styles.explanationIncorrect
                  }`}
                >
                  <div className={styles.explanationTitle}>
                    <span>{isCorrect ? '✓' : '💡'}</span>
                    <span>
                      {isCorrect ? 'Well done!' : 'Answer Explanation:'}
                    </span>
                  </div>
                  <p>{plainText(question.explanation)}</p>
                </div>
              )}

              {/* In-Card Step Navigation */}
              <div className={styles.questionNavRow}>
                <button
                  type="button"
                  className={styles.stepButton}
                  disabled={index === 0}
                  onClick={() => onJumpToQuestion(index - 1)}
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  className={styles.stepButton}
                  disabled={index === totalQuestions - 1}
                  onClick={() => onJumpToQuestion(index + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
