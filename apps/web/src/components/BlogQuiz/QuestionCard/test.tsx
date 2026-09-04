import { render, screen, fireEvent } from '@testing-library/react';
import QuestionCard from './index';

const mockQuestion = {
  id: 'q1',
  questionText: 'What is Next.js?' as never,
  explanation: 'A React framework for production.' as never,
  correctAnswerId: 'opt-a',
  options: [
    { id: 'opt-a', text: 'A React Framework' as never },
    { id: 'opt-b', text: 'A CSS preprocessor' as never },
  ],
};

describe('QuestionCard', () => {
  it('renders question header and toggles body on click', () => {
    const handleToggle = jest.fn();
    render(
      <QuestionCard
        question={mockQuestion}
        index={0}
        totalQuestions={1}
        isOpen={true}
        selectedOptionId={undefined}
        submitted={false}
        onToggle={handleToggle}
        onSelectOption={jest.fn()}
        onJumpToQuestion={jest.fn()}
      />,
    );

    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('A React Framework')).toBeInTheDocument();

    const trigger = screen.getByRole('button', { name: /01.*what is next.js\?/i });
    fireEvent.click(trigger);
    expect(handleToggle).toHaveBeenCalled();
  });

  it('triggers option selection when clicked', () => {
    const handleSelect = jest.fn();
    render(
      <QuestionCard
        question={mockQuestion}
        index={0}
        totalQuestions={1}
        isOpen={true}
        selectedOptionId="opt-a"
        submitted={false}
        onToggle={jest.fn()}
        onSelectOption={handleSelect}
        onJumpToQuestion={jest.fn()}
      />,
    );

    const optB = screen.getByText('A CSS preprocessor');
    fireEvent.click(optB);
    expect(handleSelect).toHaveBeenCalledWith('opt-b');
  });

  it('shows explanation card when submitted', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        index={0}
        totalQuestions={1}
        isOpen={true}
        selectedOptionId="opt-a"
        submitted={true}
        onToggle={jest.fn()}
        onSelectOption={jest.fn()}
        onJumpToQuestion={jest.fn()}
      />,
    );

    expect(screen.getByText(/a react framework for production/i)).toBeInTheDocument();
    expect(screen.getByText('Correct Choice ✓')).toBeInTheDocument();
  });
});
