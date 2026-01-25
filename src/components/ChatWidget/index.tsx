import React, { useState } from 'react';
import type { ChatRequest, ChatResponse, ErrorResponse } from '../../types/chat';
import { isErrorResponse } from '../../types/chat';
import styles from './styles.module.css';

/**
 * ChatWidget - Global chat component for RAG chatbot integration
 *
 * Features:
 * - Floating button (bottom-right corner)
 * - Modal dialog with input and messages
 * - Fetch integration with FastAPI backend
 * - Citation display with clickable links
 * - Error handling (network errors, empty messages)
 */

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; url: string }[];
}

// Environment-aware API URL
// In development: use localhost:8000
// In production (Vercel): use Railway backend
const getApiUrl = (): string => {
  // Check if running in browser
  if (typeof window === 'undefined') {
    return 'http://localhost:8000/chat';
  }

  // Development: localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000/chat';
  }

  // Production: Railway backend URL
  return 'https://victorious-presence-production.up.railway.app/chat';
};

const API_URL = getApiUrl();

export default function ChatWidget(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!input.trim()) {
      setError('Please enter a message');
      return;
    }

    // Check if backend URL is configured
    if (!API_URL) {
      setError(
        'Backend API not configured. To enable the chatbot on Vercel, deploy the FastAPI backend and set BACKEND_API_URL in docusaurus.config.ts customFields.'
      );
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const requestBody: ChatRequest = {
        message: input.trim(),
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send session cookie for user context
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        // Parse error response
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.message || 'Failed to get response');
      }

      const data: ChatResponse = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        sources: data.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Unable to connect to the chatbot. Please ensure the backend server is running.';

      setError(errorMessage);

      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${errorMessage}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className={styles.floatingButton}
        onClick={() => setIsOpen(true)}
        aria-label="Open chat widget"
        title="Ask a question about the textbook"
      >
        💬
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.header}>
              <h3>Ask the Textbook</h3>
              <button
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                ×
              </button>
            </div>

            {/* Messages Area */}
            <div className={styles.messagesArea}>
              {messages.length === 0 && (
                <div className={styles.emptyState}>
                  <p>👋 Ask me anything about ROS 2, Digital Twins, NVIDIA Isaac, or VLA models!</p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={styles[`message-${msg.role}`]}>
                  <div className={styles.messageContent}>
                    <strong>{msg.role === 'user' ? 'You' : 'Tutor'}:</strong>
                    <p>{msg.content}</p>

                    {/* Citations */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className={styles.sources}>
                        <strong>Sources:</strong>
                        <ul>
                          {msg.sources.map((source, i) => (
                            <li key={i}>
                              <a href={source.url} target="_blank" rel="noopener noreferrer">
                                {source.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className={styles['message-assistant']}>
                  <div className={styles.messageContent}>
                    <strong>Tutor:</strong>
                    <p className={styles.loadingText}>Thinking...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className={styles.errorBanner}>
                ⚠️ {error}
              </div>
            )}

            {/* Input Area */}
            <div className={styles.inputArea}>
              <textarea
                className={styles.input}
                placeholder="Ask a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                rows={2}
                aria-label="Chat input"
              />
              <button
                className={styles.sendButton}
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                aria-label="Send message"
              >
                {loading ? '...' : '→'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
