// src/presentation/components/features/chat/ChatContainer.tsx
// Main chat container with messages and input

import React, { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChatSession } from '@/presentation/hooks/chat/useChatSession';
import { useSendMessage } from '@/presentation/hooks/chat/useSendMessage';
import { useStreamingChat } from '@/presentation/hooks/chat/useStreamingChat';
import { Spinner } from '../../shared/Spinner';

const DEFAULT_SESSION_ID = 'default-session';

export function ChatContainer() {
  const [sessionId] = useState(DEFAULT_SESSION_ID);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const { sendMessage } = useSendMessage();
  const { streamChatResponse } = useStreamingChat();

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);

    try {
      // Add user message to UI immediately
      const userMessage = {
        id: `msg-${Date.now()}`,
        sessionId,
        content,
        role: 'user' as const,
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);

      // Send message via API
      const response = await sendMessage({
        sessionId,
        content,
        role: 'user',
      });

      // Start streaming assistant response
      if (response.responseTriggered) {
        const assistantMessageId = `assistant-${Date.now()}`;
        
        // Add empty assistant message
        const assistantMessage = {
          id: assistantMessageId,
          sessionId,
          content: '',
          role: 'assistant' as const,
          createdAt: new Date(),
          isStreaming: true,
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Stream the response
        await streamChatResponse(
          {
            sessionId,
            messageId: response.message.id,
          },
          (chunk) => {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessageId
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              )
            );
          }
        );

        // Mark as complete
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Add error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        sessionId,
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant' as const,
        createdAt: new Date(),
        isError: true,
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
        <p className="text-sm text-gray-500">How can I help you today?</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <svg className="h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">Start a conversation with the AI assistant</p>
            <p className="text-xs mt-1">Ask about jobs, settings, or anything else</p>
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
        <div ref={messagesEndRef} />
        {isLoading && (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <ChatInput 
          onSend={handleSendMessage} 
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}