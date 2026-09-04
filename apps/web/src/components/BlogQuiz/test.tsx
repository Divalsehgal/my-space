import { render, screen, fireEvent } from '@testing-library/react';
import BlogQuiz from './index';
import type { ContentfulQuiz } from '@/types';

const mockQuiz: ContentfulQuiz = {
  id: 'quiz-1',
  title: 'React Architecture Quiz',
  questions: [
    {
      id: 'q1',
      questionText: 'What is the primary benefit of Server Components?' as never,
      explanation: 'Server components reduce client bundle size by rendering on the server.' as never,
      correctAnswerId: 'opt1-a',
      options: [
        { id: 'opt1-a', text: 'Zero bundle size on client' as never },
        { id: 'opt1-b', text: 'Automatic CSS compilation' as never },
      ],
    },
    {
      id: 'q2',
      questionText: 'Which hook is used for memoizing values?' as never,
      explanation: 'useMemo caches the result of a calculation between re-renders.' as never,
      correctAnswerId: 'opt2-b',
      options: [
        { id: 'opt2-a', text: 'useCallback' as never },
        { id: 'opt2-b', text: 'useMemo' as never },
      ],
    },
  ],
};

describe('BlogQuiz Component', () => {
  it('renders quiz header, questions accordion, and quiz navigator', () => {
    render(<BlogQuiz quiz={mockQuiz} />);

    expect(screen.getByText('React Architecture Quiz')).toBeInTheDocument();
    expect(screen.getByText('Quiz Navigator')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset quiz/i })).toBeInTheDocument();
    expect(screen.getByText('Q1')).toBeInTheDocument();
    expect(screen.getByText('Q2')).toBeInTheDocument();
  });

  it('allows expanding and collapsing question accordions', () => {
    render(<BlogQuiz quiz={mockQuiz} />);

    // Q1 is open by default
    expect(screen.getByText('Zero bundle size on client')).toBeInTheDocument();

    // Toggle Q1 accordion to close it
    const q1Trigger = screen.getByRole('button', {
      name: /01.*benefit of server components/i,
    });
    fireEvent.click(q1Trigger);

    // Toggle Q2 accordion to open it
    const q2Trigger = screen.getByRole('button', {
      name: /02.*memoizing values/i,
    });
    fireEvent.click(q2Trigger);

    expect(screen.getByText('useMemo')).toBeInTheDocument();
  });

  it('updates navigator status and submits to show learning score dashboard', () => {
    render(<BlogQuiz quiz={mockQuiz} />);

    // Answer Q1 with correct answer
    const q1OptA = screen.getByText('Zero bundle size on client');
    fireEvent.click(q1OptA);

    // Open Q2 and answer with incorrect answer
    const q2Trigger = screen.getByRole('button', {
      name: /02.*memoizing values/i,
    });
    fireEvent.click(q2Trigger);

    const q2OptA = screen.getByText('useCallback');
    fireEvent.click(q2OptA);

    // Submit button should be enabled
    const submitBtn = screen.getByRole('button', {
      name: /see your learning score/i,
    });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    // Verify Learning Score Dashboard is shown
    expect(screen.getAllByText('50%').length).toBeGreaterThan(0);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText('Total Questions')).toBeInTheDocument();
    expect(screen.getByText('Mistakes')).toBeInTheDocument();
    expect(screen.getByText('Retake Quiz')).toBeInTheDocument();

    // Verify explanation callouts appear
    expect(screen.getByText(/server components reduce client bundle size/i)).toBeInTheDocument();
    expect(screen.getByText(/usememo caches the result/i)).toBeInTheDocument();
  });

  it('resets the quiz when Reset button is clicked', () => {
    render(<BlogQuiz quiz={mockQuiz} />);

    // Select an option
    const q1OptA = screen.getByText('Zero bundle size on client');
    fireEvent.click(q1OptA);

    // Click reset
    const resetBtn = screen.getByRole('button', { name: /reset quiz/i });
    fireEvent.click(resetBtn);

    // Submit button should be back to answering requirement
    expect(
      screen.getByRole('button', { name: /answer all questions \(0\/2\)/i }),
    ).toBeDisabled();
  });

  it('supports jumpToQuestion navigation via Quiz Navigator pills', () => {
    render(<BlogQuiz quiz={mockQuiz} />);

    const q2Pill = screen.getByRole('button', { name: /jump to question 2/i });
    fireEvent.click(q2Pill);

    // Q2 should now be open
    expect(screen.getByText('useMemo')).toBeInTheDocument();
  });

  it('returns null if quiz is empty', () => {
    const { container } = render(
      <BlogQuiz quiz={{ id: 'empty', title: '', questions: [] }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
