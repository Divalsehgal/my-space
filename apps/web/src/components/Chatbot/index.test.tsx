import { render, screen, fireEvent } from '@testing-library/react';
import Chatbot from './index';
import { useChat } from './hooks/useChat';

// Mock useChat hook
jest.mock('./hooks/useChat', () => ({
  useChat: jest.fn(),
}));

describe('Chatbot Component', () => {
  const mockSendMessage = jest.fn();
  const mockClearHistory = jest.fn();

  const mockUseChat = (overrides = {}) => {
    (useChat as jest.Mock).mockReturnValue({
      messages: [],
      isTyping: false,
      sendMessage: mockSendMessage,
      clearHistory: mockClearHistory,
      ...overrides,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChat();
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

  it('does not render a clear button while the conversation is empty', () => {
    render(<Chatbot />);
    fireEvent.click(screen.getByLabelText(/toggle chatbot/i));
    expect(screen.queryByLabelText(/start a new chat/i)).not.toBeInTheDocument();
  });

  it('renders assistant messages and hides empty/system entries', () => {
    mockUseChat({
      messages: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello there!' },
        { role: 'assistant', content: '' },
        { role: 'system', content: 'internal' },
      ],
    });
    render(<Chatbot />);
    fireEvent.click(screen.getByLabelText(/toggle chatbot/i));
    expect(screen.getByText('Hello there!')).toBeInTheDocument();
    expect(screen.queryByText('internal')).not.toBeInTheDocument();
  });

  it('clears the conversation when the new chat button is clicked', () => {
    mockUseChat({
      messages: [{ role: 'user', content: 'Hi' }],
    });
    render(<Chatbot />);
    fireEvent.click(screen.getByLabelText(/toggle chatbot/i));
    fireEvent.click(screen.getByLabelText(/start a new chat/i));
    expect(mockClearHistory).toHaveBeenCalledTimes(1);
  });

  it('shows the typing indicator only while waiting for the first token', () => {
    const { rerender } = render(<Chatbot />);
    fireEvent.click(screen.getByLabelText(/toggle chatbot/i));

    // Waiting: last message is the user's, and the assistant is typing.
    mockUseChat({
      messages: [{ role: 'user', content: 'Hi' }],
      isTyping: true,
    });
    rerender(<Chatbot />);
    expect(document.querySelector('[class*="chatbot__typing"]')).toBeInTheDocument();

    // Streaming started: assistant bubble exists, so the indicator is hidden.
    mockUseChat({
      messages: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hel' },
      ],
      isTyping: true,
    });
    rerender(<Chatbot />);
    expect(document.querySelector('[class*="chatbot__typing"]')).not.toBeInTheDocument();
  });
});
