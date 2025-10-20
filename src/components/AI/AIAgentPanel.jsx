import React, { useState, useRef, useEffect } from 'react';

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
  onTogglePanel = null,
  isServiceAvailable = true
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
      className={`fixed bottom-5 right-5 w-96 h-96 z-[1000] bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl font-sans select-none transition-all duration-300 ease-out flex flex-col overflow-hidden ${
        isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      } ${isMinimized ? 'h-15' : ''} hover:shadow-2xl dark:bg-gray-700/95 dark:border-gray-600 dark:hover:shadow-3xl`}
      role="dialog"
      aria-label="AI Canvas Agent"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-inherit flex-shrink-0 min-h-15 dark:border-gray-600">
        <div className="flex items-center gap-3">
          <span className="text-xl w-6 h-6 flex items-center justify-center" aria-hidden="true">🤖</span>
          <h3 className="m-0 text-base font-semibold text-gray-700 tracking-tight dark:text-gray-100">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 border-0 rounded-lg bg-transparent cursor-pointer transition-all duration-150 ease-out text-sm text-gray-500 flex items-center justify-center hover:bg-primary-500/10 hover:text-primary-500 focus:outline-2 focus:outline-primary-500 focus:outline-offset-2 dark:text-gray-400 dark:hover:bg-primary-500/20 dark:hover:text-primary-400"
            onClick={handleMinimizeToggle}
            aria-label={isMinimized ? 'Expand panel' : 'Minimize panel'}
            title={isMinimized ? 'Expand panel' : 'Minimize panel'}
          >
            {isMinimized ? '⬆' : '⬇'}
          </button>
          <button
            className="w-8 h-8 border-0 rounded-lg bg-transparent cursor-pointer transition-all duration-150 ease-out text-sm text-gray-500 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 focus:outline-2 focus:outline-primary-500 focus:outline-offset-2 dark:text-gray-400 dark:hover:bg-red-500/20 dark:hover:text-red-400"
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 flex flex-col gap-3">
              {messages.length === 0 ? (
                <div className="p-5 bg-primary-500/5 rounded-xl border border-primary-500/10 dark:bg-primary-500/10 dark:border-primary-500/20">
                  {isServiceAvailable ? (
                    <>
                      <p className="m-0 mb-3 text-sm text-gray-700 leading-relaxed dark:text-gray-100">Welcome! I can help you manipulate the canvas with natural language commands.</p>
                      <p className="m-0 mb-2 text-sm text-gray-700 leading-relaxed dark:text-gray-100">Try saying:</p>
                      <ul className="m-2 ml-5 p-0">
                        <li className="text-sm text-primary-500 mb-1 font-mono">"Create a red circle"</li>
                        <li className="text-sm text-primary-500 mb-1 font-mono">"Move the blue rectangle to the center"</li>
                        <li className="text-sm text-primary-500 mb-1 font-mono">"Arrange these shapes in a row"</li>
                      </ul>
                    </>
                  ) : (
                    <div className="text-center">
                      <p className="m-0 mb-2 text-sm text-red-600 dark:text-red-400">⚠️ AI Assistant is not available</p>
                      <p className="m-0 mb-2 text-sm text-gray-700 dark:text-gray-100">To enable AI features, please configure your OpenAI API key in the .env file.</p>
                      <p className="m-0 text-sm text-gray-700 dark:text-gray-100">See the README for setup instructions.</p>
                    </div>
                  )}
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex flex-col gap-1 max-w-[85%] ${
                      message.role === 'user' ? 'self-end' : 
                      message.role === 'assistant' ? 'self-start' : 
                      'self-center max-w-full'
                    }`}
                    role="log"
                    aria-label={`${message.role} message`}
                  >
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed break-words relative ${
                      message.role === 'user' 
                        ? 'bg-primary-500 text-white rounded-br-sm' 
                        : message.role === 'assistant'
                        ? 'bg-gray-100 text-gray-800 rounded-bl-sm dark:bg-gray-600 dark:text-gray-100'
                        : 'bg-red-500/10 text-red-600 rounded-lg text-center text-xs dark:bg-red-500/20 dark:text-red-400'
                    }`}>
                      {message.content}
                    </div>
                    <div className={`text-xs text-gray-600 px-1 font-mono ${
                      message.role === 'user' ? 'text-right' : 
                      message.role === 'assistant' ? 'text-left' : 
                      'text-center'
                    } dark:text-gray-400`}>
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
            <div className="flex items-center gap-3 px-5 py-4 bg-primary-500/5 border-t border-primary-500/10 flex-shrink-0">
              <div className="w-5 h-5 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" aria-hidden="true"></div>
              <span className="text-sm text-primary-500 font-medium">AI is thinking...</span>
            </div>
          )}

          {/* Input area */}
          <div className="px-5 py-4 border-t border-black/8 bg-inherit flex-shrink-0">
            <div className="flex items-end gap-3 bg-black/2 border border-black/10 rounded-xl px-3 py-2 transition-all duration-150 ease-out focus-within:border-primary-500 focus-within:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] dark:bg-white/5 dark:border-gray-600/30 dark:focus-within:border-primary-500 dark:focus-within:shadow-[0_0_0_3px_rgba(102,126,234,0.2)]">
              <textarea
                ref={inputRef}
                className="flex-1 border-0 bg-transparent text-sm leading-relaxed text-gray-700 resize-none outline-none font-inherit min-h-5 max-h-30 overflow-y-auto dark:text-gray-200"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder={isServiceAvailable ? "Type your command here... (Enter to send, Shift+Enter for new line)" : "AI service not available"}
                disabled={isLoading || !isServiceAvailable}
                rows={1}
                aria-label="AI command input"
              />
              <button
                className="w-9 h-9 border-0 rounded-lg bg-primary-500 text-white cursor-pointer transition-all duration-150 ease-out flex items-center justify-center flex-shrink-0 hover:bg-primary-600 hover:-translate-y-0.5 active:translate-y-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || !isServiceAvailable}
                aria-label="Send message"
                title="Send message"
              >
                <span className="text-base rotate-0 transition-transform duration-150 ease-out hover:rotate-15" aria-hidden="true">➤</span>
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-600 text-center dark:text-gray-400">
              Press <kbd className="bg-black/10 px-1.5 py-0.5 rounded font-mono text-xs dark:bg-white/10">Cmd+K</kbd> to toggle this panel
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAgentPanel;