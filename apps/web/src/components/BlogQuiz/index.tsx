'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import QuizNavigator from './QuizNavigator';
import QuestionCard from './QuestionCard';
import QuizResults from './QuizResults';
import { getTierInfo, type BlogQuizProps } from './types';
import styles from './styles.module.scss';

export default function BlogQuiz({ quiz }: Readonly<BlogQuizProps>) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [openQuestions, setOpenQuestions] = useState<Record<number, boolean>>({ 0: true });

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return null;
  }

  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const score = quiz.questions.filter(
    (q) => answers[q.id] === q.correctAnswerId,
  ).length;
  const percentage = Math.round((score / totalQuestions) * 100);

  const resetQuiz = () => {
    setAnswers({});
    setSubmitted(false);
    setOpenQuestions({ 0: true });
  };

  const toggleAccordion = (index: number) => {
    setOpenQuestions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const expandAll = () => {
    const allOpen: Record<number, boolean> = {};
    quiz.questions.forEach((_, idx) => {
      allOpen[idx] = true;
    });
    setOpenQuestions(allOpen);
  };

  const handleOptionSelect = (questionId: string, optionId: string) => {
    if (submitted) {
      return;
    }
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const tier = getTierInfo(percentage);

  return (
    <section
      id={`quiz-${quiz.id}`}
      className={styles.quizContainer}
      aria-label={quiz.title}
    >
      <div className={styles.ambientGlow} aria-hidden="true" />

      {/* Quiz Header */}
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <span className={styles.headerBadge}>Assessment</span>
        </div>

        <button
          className={styles.resetButton}
          onClick={resetQuiz}
          type="button"
          aria-label="Reset quiz answers"
        >
          <span>↺</span>
          <span>Reset Quiz</span>
        </button>
      </div>

      {/* Quiz Progress Stepper */}
      <QuizNavigator
        answers={answers}
        submitted={submitted}
        score={score}
        totalQuestions={totalQuestions}
        percentage={percentage}
        tierColor={tier.color}
      />

      {/* Accordion Questions List */}
      <div className={styles.questionsList}>
        {quiz.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            isOpen={Boolean(openQuestions[index])}
            selectedOptionId={answers[question.id]}
            submitted={submitted}
            onToggle={() => toggleAccordion(index)}
            onSelectOption={(optId) => handleOptionSelect(question.id, optId)}
          />
        ))}
      </div>

      {/* Submit Action Bar */}
      {!submitted && (
        <div className={styles.submitSection}>
          <button
            className={styles.submitActionBtn}
            onClick={() => setSubmitted(true)}
            disabled={answeredCount !== totalQuestions}
            type="button"
          >
            <span>
              {answeredCount === totalQuestions
                ? 'See Your Learning Score'
                : `Answer all questions (${answeredCount}/${totalQuestions})`}
            </span>
          </button>
        </div>
      )}

      {/* Learning Score Dashboard */}
      <AnimatePresence>
        {submitted && (
          <QuizResults
            score={score}
            totalQuestions={totalQuestions}
            percentage={percentage}
            tier={tier}
            onReset={resetQuiz}
            onExpandAll={expandAll}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
