// src/presentation/components/features/jobs/JobCard.tsx
// Individual job card component

import React from 'react';
import { Job } from '@/core/domain/entities/Job';
import { JobStatus } from '@/core/domain/value-objects/JobStatus';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from '../../shared/ProgressBar';
import Link from 'next/link';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case JobStatus.PROCESSING:
        return 'bg-blue-100 text-blue-800';
      case JobStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case JobStatus.FAILED:
        return 'bg-red-100 text-red-800';
      case JobStatus.PAUSED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const progress = job.completedItems / Math.max(job.totalItems, 1);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <Link href={`/jobs/${job.id}`} className="hover:underline">
              <h3 className="text-lg font-semibold text-gray-900 truncate max-w-xs">{job.name}</h3>
            </Link>
            <div className="flex items-center space-x-2">
              <StatusBadge status={job.status} />
              <span className="text-sm text-gray-500">
                {job.createdAt.toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-sm text-gray-600">
              {job.completedItems} of {job.totalItems} items completed
            </p>
            <ProgressBar value={progress * 100} className="mt-2" />
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{job.duration} minutes</span>
            </div>
            <div className="flex items-center">
              <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{job.voiceSettings?.voiceId || 'Default voice'}</span>
            </div>
          </div>
        </div>

        <div className="ml-4 flex flex-col space-y-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}