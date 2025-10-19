import React, { useState, useRef, useEffect } from 'react';
import './AIAgentPanel.css';

/**
 * AI Agent Panel Component
 * Provides a natural language interface for canvas manipulation
 * Floating panel in bottom-right corner with chat-like interface
 */
const AIAgentPanel = ({
  isVisible = true,
  isOpen = false,
  onCommand = null,
  isLoading = false,
  messages = [],
  onSendMessage = null,
  onTogglePanel = null
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Cmd+K or Ctrl+K to toggle panel
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        if (onTogglePanel) {
          onTogglePanel(!isOpen);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onTogglePanel]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  if (!isVisible) return null;

  const handleMinimizeToggle = () => {
    setIsMinimized(!isMinimized);
  };

  const handleSendMessage = () => {
    if (inputValue.trim() && onSendMessage && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  return (
    <div 
      className={`ai-agent-panel ${isOpen ? 'open' : 'closed'} ${isMinimized ? 'minimized' : 'expanded'}`}
      role="dialog"
      aria-label="AI Canvas Agent"
    >
      {/* Header */}
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <span className="ai-icon" aria-hidden="true">🤖</span>
          <h3 className="ai-title">AI Assistant</h3>
        </div>
        <div className="ai-panel-controls">
          <button
            className="ai-control-button minimize-button"
            onClick={handleMinimizeToggle}
            aria-label={isMinimized ? 'Expand panel' : 'Minimize panel'}
            title={isMinimized ? 'Expand panel' : 'Minimize panel'}
          >
            {isMinimized ? '⬆' : '⬇'}
          </button>
          <button
            className="ai-control-button close-button"
            onClick={() => {
              if (onTogglePanel) {
                onTogglePanel(false);
              }
            }}
            aria-label="Close AI panel"
            title="Close AI panel"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="ai-panel-content">
          {/* Messages */}
          <div className="ai-messages-container">
            <div className="ai-messages">
              {messages.length === 0 ? (
                <div className="ai-welcome-message">
                  <p>Welcome! I can help you manipulate the canvas with natural language commands.</p>
                  <p>Try saying:</p>
                  <ul>
                    <li>"Create a red circle"</li>
                    <li>"Move the blue rectangle to the center"</li>
                    <li>"Arrange these shapes in a row"</li>
                  </ul>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`ai-message ${message.role}`}
                    role="log"
                    aria-label={`${message.role} message`}
                  >
                    <div className="ai-message-content">
                      {message.content}
                    </div>
                    <div className="ai-message-timestamp">
                      {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="ai-loading-indicator">
              <div className="ai-loading-spinner" aria-hidden="true"></div>
              <span className="ai-loading-text">AI is thinking...</span>
            </div>
          )}

          {/* Input area */}
          <div className="ai-input-container">
            <div className="ai-input-wrapper">
              <textarea
                ref={inputRef}
                className="ai-input"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="Type your command here... (Enter to send, Shift+Enter for new line)"
                disabled={isLoading}
                rows={1}
                aria-label="AI command input"
              />
              <button
                className="ai-send-button"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                aria-label="Send message"
                title="Send message"
              >
                <span className="ai-send-icon" aria-hidden="true">➤</span>
              </button>
            </div>
            <div className="ai-input-hint">
              Press <kbd>Cmd+K</kbd> to toggle this panel
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAgentPanel;
