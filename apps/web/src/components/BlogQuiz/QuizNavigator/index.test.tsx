import { render, screen } from '@testing-library/react';
import QuizNavigator from './index';

describe('QuizNavigator', () => {
  it('shows answered count before submission', () => {
    render(
      <QuizNavigator
        answers={{ q1: 'opt1' }}
        submitted={false}
        score={0}
        totalQuestions={2}
        percentage={0}
        tierColor="#6366f1"
      />,
    );

    expect(screen.getByText('1 of 2 Answered')).toBeInTheDocument();
  });

  it('shows score once submitted', () => {
    render(
      <QuizNavigator
        answers={{ q1: 'opt1', q2: 'wrong' }}
        submitted={true}
        score={1}
        totalQuestions={2}
        percentage={50}
        tierColor="#f59e0b"
      />,
    );

    expect(screen.getByText('1 of 2 Correct (50%)')).toBeInTheDocument();
  });
});
