import { render, screen, fireEvent } from '@testing-library/react';
import QuizResults from './index';

const mockTier = {
  badge: '🏆 Flawless Mastery',
  title: 'Outstanding! Perfect score!',
  desc: 'You answered every question accurately.',
  color: '#10b981',
  bgColor: 'rgba(16, 185, 129, 0.15)',
};

describe('QuizResults', () => {
  it('renders score metrics and triggers reset/expand callbacks', () => {
    const handleReset = jest.fn();
    const handleExpandAll = jest.fn();

    render(
      <QuizResults
        score={3}
        totalQuestions={3}
        percentage={100}
        tier={mockTier}
        onReset={handleReset}
        onExpandAll={handleExpandAll}
      />,
    );

    // "100%" renders twice by design: the radial gauge center and the
    // "Accuracy Rate" metric card both display the percentage.
    expect(screen.getAllByText('100%')).toHaveLength(2);
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(screen.getByText('🏆 Flawless Mastery')).toBeInTheDocument();

    const retakeBtn = screen.getByRole('button', { name: /retake quiz/i });
    fireEvent.click(retakeBtn);
    expect(handleReset).toHaveBeenCalled();

    const reviewBtn = screen.getByRole('button', { name: /review all answers/i });
    fireEvent.click(reviewBtn);
    expect(handleExpandAll).toHaveBeenCalled();
  });
});
