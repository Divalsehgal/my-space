import { render, screen, fireEvent } from '@testing-library/react';
import Chatbot from './index';
import { useChat } from './hooks/useChat';

// Mock useChat hook
jest.mock('./hooks/useChat', () => ({
  useChat: jest.fn(),
}));

describe('Chatbot Component', () => {
  const mockSendMessage = jest.fn();
  
  beforeEach(() => {
    (useChat as jest.Mock).mockReturnValue({
      messages: [],
      isTyping: false,
      sendMessage: mockSendMessage,
    });
  });

  it('renders the toggle button initially', () => {
    render(<Chatbot />);
    expect(screen.getByLabelText(/toggle chatbot/i)).toBeInTheDocument();
  });

  it('opens the chat window when clicked', () => {
    render(<Chatbot />);
    const button = screen.getByLabelText(/toggle chatbot/i);
    fireEvent.click(button);
    expect(screen.getByText(/assistant/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ask a question/i)).toBeInTheDocument();
  });

  it('shows suggestions when the chat is empty', () => {
    render(<Chatbot />);
    fireEvent.click(screen.getByLabelText(/toggle chatbot/i));
    expect(screen.getByText(/tell me about dival/i)).toBeInTheDocument();
    expect(screen.getByText(/send a message to dival/i)).toBeInTheDocument();
  });

  it('calls sendMessage when a suggestion is clicked', () => {
    render(<Chatbot />);
    fireEvent.click(screen.getByLabelText(/toggle chatbot/i));
    const suggestion = screen.getByText(/tell me about dival/i);
    fireEvent.click(suggestion);
    expect(mockSendMessage).toHaveBeenCalledWith('Tell me about Dival');
  });

  it('submits a message through the input field', () => {
    render(<Chatbot />);
    fireEvent.click(screen.getByLabelText(/toggle chatbot/i));
    const input = screen.getByPlaceholderText(/ask a question/i);
    fireEvent.change(input, { target: { value: 'How are you?' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(mockSendMessage).toHaveBeenCalledWith('How are you?');
  });
});
