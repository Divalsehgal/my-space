import type { ContentfulQuizQuestion } from '@/types';
import { plainText } from '../../types';
import styles from './styles.module.scss';
import { useT } from "@/i18n/client";

/** Options are lettered A, B, C… */
const FIRST_OPTION_LETTER = "A".charCodeAt(0);

interface QuestionOptionsProps {
  question: ContentfulQuizQuestion;
  index: number;
  selectedOptionId: string | undefined;
  submitted: boolean;
  isCorrect: boolean;
  onSelectOption: (optionId: string) => void;
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

/** The lettered answer choices and, once submitted, the explanation. */
export default function QuestionOptions({
  question,
  index,
  selectedOptionId,
  submitted,
  isCorrect,
  onSelectOption,
}: Readonly<QuestionOptionsProps>) {
  const t = useT();
  return (
    <>
      {/* Vertical Stack of Options */}
      <div
        className={styles.optionsGroup}
        role="radiogroup"
        aria-label={t("quiz.optionsFor", { number: index + 1 })}
      >
        {question.options.map((option, optionIndex) => {
          const isOptionSelected = selectedOptionId === option.id;
          const isOptionCorrect = option.id === question.correctAnswerId;
          const optionClass = getOptionClass(
            isOptionSelected,
            isOptionCorrect,
            submitted,
          );
          const optionLetter = String.fromCharCode(FIRST_OPTION_LETTER + optionIndex);

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
                  {t("quiz.correctChoice")}
                </span>
              )}
              {submitted && isOptionSelected && !isOptionCorrect && (
                <span className={`${styles.verdictBadge} ${styles.verdictIncorrect}`}>
                  {t("quiz.yourChoice")}
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
              {t(isCorrect ? "quiz.wellDone" : "quiz.explanation")}
            </span>
          </div>
          <p>{plainText(question.explanation)}</p>
        </div>
      )}
    </>
  );
}
