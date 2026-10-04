"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useChat } from "../hooks/useChat";
import ChatComposer from "./ChatComposer";
import ChatEmptyState from "./ChatEmptyState";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import styles from "./styles.module.scss";

/** Pop-in for the chat window: a slight rise and scale from the launcher. */
const WINDOW_MOTION = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
} as const;

/**
 * The chat window and all chat state. Loaded on the first open (see index.tsx)
 * so history fetching and markdown rendering cost nothing for visitors who
 * never open the chat; stays mounted afterwards so the conversation survives
 * closing and reopening.
 */
interface ChatPanelProps {
  open: boolean;
  /** A question handed over by the terminal / palette, sent once. */
  pendingMessage?: string | null;
  onPendingSent?: () => void;
}

export default function ChatPanel({ open, pendingMessage, onPendingSent }: Readonly<ChatPanelProps>) {
  const { messages, isTyping, sendMessage, retryLastMessage, clearHistory } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pendingMessage && open) {
      void sendMessage(pendingMessage);
      onPendingSent?.();
    }
  }, [pendingMessage, open, sendMessage, onPendingSent]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, open]);

  // Typing dots only until the first streamed token creates the reply bubble.
  const waitingForFirstToken = isTyping && messages.at(-1)?.role === "user";

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="chatbot-window" {...WINDOW_MOTION} className={styles["chat-panel"]}>
          <ChatHeader canClear={messages.length > 0} onClear={clearHistory} />

          <div ref={scrollRef} className={styles["chat-panel__messages"]} role="log" aria-live="polite" aria-relevant="additions text">
            {messages.length === 0 && !isTyping && <ChatEmptyState onSuggest={sendMessage} />}
            {messages.map((message, index) =>
              message.role === "system" || message.content.length === 0 ? null : (
                <ChatMessage key={`${message.role}-${index}`} message={message} onRetry={retryLastMessage} />
              ),
            )}
            {waitingForFirstToken && <TypingIndicator />}
          </div>

          <ChatComposer disabled={isTyping} onSend={sendMessage} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
