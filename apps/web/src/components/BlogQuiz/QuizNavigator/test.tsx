import { render, screen, fireEvent } from '@testing-library/react';
import QuizNavigator from './index';

const mockQuestions = [
  {
    id: 'q1',
    questionText: 'Question 1' as never,
    explanation: 'Exp 1' as never,
    correctAnswerId: 'opt1',
    options: [],
  },
  {
    id: 'q2',
    questionText: 'Question 2' as never,
    explanation: 'Exp 2' as never,
    correctAnswerId: 'opt2',
    options: [],
  },
];

describe('QuizNavigator', () => {
  it('renders pills for each question and triggers jump callback', () => {
    const handleJump = jest.fn();
    render(
      <QuizNavigator
        questions={mockQuestions}
        answers={{ q1: 'opt1' }}
        openQuestions={{ 0: true }}
        submitted={false}
        score={0}
        totalQuestions={2}
        percentage={0}
        tierColor="#6366f1"
        onJumpToQuestion={handleJump}
      />,
    );

    expect(screen.getByText('1 of 2 Answered')).toBeInTheDocument();
    const q2Pill = screen.getByRole('button', { name: /jump to question 2/i });
    fireEvent.click(q2Pill);
    expect(handleJump).toHaveBeenCalledWith(1);
  });

  it('renders correct/incorrect status when submitted', () => {
    render(
      <QuizNavigator
        questions={mockQuestions}
        answers={{ q1: 'opt1', q2: 'wrong' }}
        openQuestions={{ 0: true }}
        submitted={true}
        score={1}
        totalQuestions={2}
        percentage={50}
        tierColor="#f59e0b"
        onJumpToQuestion={jest.fn()}
      />,
    );

    expect(screen.getByText('1 of 2 Correct (50%)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /jump to question 1: correct/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /jump to question 2: incorrect/i })).toBeInTheDocument();
  });
});
