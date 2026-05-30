"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChat } from "./hooks/useChat";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./styles.module.scss";
import clsx from "clsx";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isTyping, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  return (
    <div className={styles["chatbot"]}>
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={styles["chatbot__toggle"]}
          aria-label="Toggle Chatbot"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.svg
                key="close"
                initial={{ opacity: 0, rotate: 45, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -45, scale: 0.5 }}
                style={{ width: "24px", height: "24px" }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </motion.svg>
            ) : (
              <motion.svg
                key="open"
                initial={{ opacity: 0, rotate: -45, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 45, scale: 0.5 }}
                style={{ width: "24px", height: "24px" }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
              </motion.svg>
            )}
          </AnimatePresence>
        </button>

        {/* Chat Window */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="chatbot-window"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={styles["chatbot__window"]}
            >
              {/* Header */}
              <div className={styles["chatbot__header"]}>
                <div className={styles["chatbot__header-info"]}>
                  <div className={styles["chatbot__avatar"]}>D</div>
                  <div>
                    <h3 className={styles["chatbot__title"]}>
                      Portfolio Assistant
                    </h3>
                    <div className={styles["chatbot__status"]}>
                      <span className={styles["chatbot__status-dot"]}></span>
                      <span className={styles["chatbot__status-text"]}>
                        Online
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div ref={scrollRef} className={styles["chatbot__messages"]}>
                {messages.length === 0 && !isTyping && (
                  <div className={styles["chatbot__empty-state"]}>
                    <div className={styles["chatbot__empty-icon"]}>
                      <svg
                        style={{ width: "32px", height: "32px" }}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                      </svg>
                    </div>
                    <h4 className={styles["chatbot__empty-title"]}>
                      How can I help?
                    </h4>
                    <p className={styles["chatbot__empty-copy"]}>
                      Ask about Dival&apos;s portfolio, blogs, projects, or
                      experience.
                    </p>
                    <div className={styles["chatbot__suggestions"]}>
                      {[
                        "Tell me about Dival",
                        "Show me Dival's projects",
                        "How can I contact him?",
                        "Send a message to Dival",
                      ].map((s) => (
                        <button
                          key={s}
                          onClick={() => sendMessage(s)}
                          className={styles["chatbot__suggestion-btn"]}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div
                    key={`${m.role}-${i}`}
                    className={clsx(
                      styles["chatbot__message-wrapper"],
                      m.role === "user"
                        ? styles["chatbot__message-wrapper--user"]
                        : styles["chatbot__message-wrapper--assistant"],
                    )}
                  >
                    <div
                      className={clsx(
                        styles["chatbot__message"],
                        m.role === "user"
                          ? styles["chatbot__message--user"]
                          : styles["chatbot__message--assistant"],
                      )}
                    >
                      {m.role === "assistant" && (
                        <div className={styles["chatbot__message-meta"]}>
                          <div className={styles["chatbot__message-avatar"]}>
                            D
                          </div>
                          <span className={styles["chatbot__message-author"]}>
                            Portfolio Assistant
                          </span>
                        </div>
                      )}
                      <div>{m.content}</div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className={styles["chatbot__message-wrapper"]}>
                    <div className={styles["chatbot__typing"]}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <form
                onSubmit={handleSubmit}
                className={styles["chatbot__input-area"]}
                aria-label="Chat input"
              >
                <div className={styles["chatbot__input-wrapper"]}>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question about Dival..."
                    className={styles["chatbot__input"]}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className={styles["chatbot__send"]}
                  >
                    <svg
                      style={{ width: "20px", height: "20px" }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
                    </svg>
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}
