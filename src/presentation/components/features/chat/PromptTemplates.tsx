// src/presentation/components/features/chat/PromptTemplates.tsx
// Prompt templates for quick message composition

import React from 'react';
import { Button } from '../../shared/Button';

const templates = [
  {
    id: 'job-status',
    title: 'Check Job Status',
    description: 'Ask about the status of your jobs',
    content: 'What is the current status of all my jobs?',
  },
  {
    id: 'create-job',
    title: 'Create New Job',
    description: 'Start a new audio generation job',
    content: 'Please create a new job from my CSV file with these settings...',
  },
  {
    id: 'voice-settings',
    title: 'Voice Settings',
    description: 'Configure voice preferences',
    content: 'What voice settings do you recommend for professional audio?',
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Get help with issues',
    content: 'I am having trouble with audio generation. Can you help?',
  },
];

interface PromptTemplatesProps {
  onSelect?: (content: string) => void;
}

export function PromptTemplates({ onSelect }: PromptTemplatesProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Prompt Templates</h3>
        <Button variant="secondary" size="sm">
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect?.(template.content)}
            className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="font-medium text-sm mb-1">{template.title}</div>
            <div className="text-xs text-gray-500 mb-2">{template.description}</div>
            <div className="text-xs text-gray-700 truncate">{template.content}</div>
          </button>
        ))}
      </div>

      <div className="pt-2">
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          View All Templates
        </Button>
      </div>
    </div>
  );
}