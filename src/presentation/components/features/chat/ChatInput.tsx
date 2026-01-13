// src/presentation/components/features/chat/ChatInput.tsx
// Chat input component with message composition

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../shared/Button';
import { Spinner } from '../../shared/Spinner';

interface ChatInputProps {
  onSend: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({ 
  onSend, 
  isLoading = false, 
  placeholder = 'Type your message...',
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsTyping(true)}
            onBlur={() => setIsTyping(false)}
            placeholder={placeholder}
            disabled={isLoading || disabled}
            className="w-full min-h-[44px] max-h-[120px] resize-none rounded-lg border border-gray-300 px-4 py-2 pr-12 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
            rows={1}
          />
          <div className="absolute right-2 bottom-2 flex space-x-1">
            {isTyping && (
              <button
                type="button"
                onClick={() => {
                  // Insert suggestion
                  setMessage(prev => prev + ' {{titre}}');
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Insert variable"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 01-3 0v3m0 0a1.5 1.5 0 00-3 0v-3m0 0a1.5 1.5 0 013 0" />
                </svg>
              </button>
            )}
            {message.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setMessage('')}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Clear"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <Button
          type="submit"
          variant="primary"
          disabled={!message.trim() || isLoading || disabled}
          className="h-10 w-10 p-0 flex-shrink-0"
        >
          {isLoading ? (
            <Spinner size="sm" className="text-white" />
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </Button>
      </div>
      {isTyping && (
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <div className="flex space-x-4">
            <button type="button" className="hover:text-gray-700" onClick={() => setMessage(prev => prev + ' {{titre}}')}>Title</button>
            <button type="button" className="hover:text-gray-700" onClick={() => setMessage(prev => prev + ' {{details}}')}>Details</button>
            <button type="button" className="hover:text-gray-700" onClick={() => setMessage(prev => prev + ' {{category}}')}>Category</button>
          </div>
          <div>
            <kbd className="bg-gray-100 px-2 py-1 rounded">Shift + Enter</kbd> for new line
          </div>
        </div>
      )}
    </form>
  );
}