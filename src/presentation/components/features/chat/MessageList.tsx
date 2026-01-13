// src/presentation/components/features/chat/MessageList.tsx
// List of chat messages

import React from 'react';
import { MessageBubble } from './MessageBubble';

interface Message {
  id: string;
  sessionId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: Date;
  isStreaming?: boolean;
  isError?: boolean;
}

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageBubble 
          key={message.id}
          message={message}
        />
      ))}
    </div>
  );
}