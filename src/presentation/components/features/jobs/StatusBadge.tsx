// src/presentation/components/features/jobs/StatusBadge.tsx
// Status badge component for jobs and items

import React from 'react';
import { cn } from '@/shared/utils/cn';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'paused':
        return 'bg-gray-100 text-gray-800';
      case 'validated':
        return 'bg-purple-100 text-purple-800';
      case 'validating':
        return 'bg-indigo-100 text-indigo-800';
      case 'text_generation':
        return 'bg-cyan-100 text-cyan-800';
      case 'audio_generation':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return status
      .replace('_', ' ')
      .replace('\b\w', (match) => match.toUpperCase());
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
        getStatusStyle(status),
        className
      )}
    >
      {getStatusText(status)}
    </span>
  );
}