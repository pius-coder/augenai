// src/presentation/components/features/chat/MessageBubble.tsx
// Individual message bubble

import React from 'react';
import { cn } from '@/shared/utils/cn';

interface Message {
  id: string;
  sessionId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: Date;
  isStreaming?: boolean;
  isError?: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';

  return (
    <div 
      className={cn(
        'flex items-end',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div 
        className={cn(
          'max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-3 text-sm',
          isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-900 rounded-bl-none',
          message.isError && 'bg-red-100 text-red-800',
          message.isStreaming && 'border-l-2 border-blue-500'
        )}
      >
        {message.isSystem ? (
          <div className="text-xs text-gray-500 italic mb-1">System</div>
        ) : null}
        <div className="whitespace-pre-wrap">
          {message.content}
        </div>
        {message.isStreaming && (
          <div className="mt-1 flex space-x-1">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce"></div>
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}
        <div className={cn(
          'mt-1 text-xs',
          isUser ? 'text-blue-100' : 'text-gray-500'
        )}>
          {message.createdAt.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}