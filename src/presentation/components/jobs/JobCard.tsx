// src/presentation/components/jobs/JobCard.tsx
// Job card component for displaying job summary

'use client';

import React from 'react';
import { Job } from '@/core/domain/entities/Job';
import { JobStatus } from '@/core/domain/value-objects/JobStatus';

interface JobCardProps {
  job: any;
  onClick?: () => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.DRAFT:
        return 'bg-gray-200 text-gray-800';
      case JobStatus.PROCESSING:
        return 'bg-blue-200 text-blue-800';
      case JobStatus.PAUSED:
        return 'bg-yellow-200 text-yellow-800';
      case JobStatus.COMPLETED:
        return 'bg-green-200 text-green-800';
      case JobStatus.FAILED:
        return 'bg-red-200 text-red-800';
      case JobStatus.CANCELLED:
        return 'bg-gray-300 text-gray-700';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div
      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{job.name}</h3>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
            job.status
          )}`}
        >
          {job.status}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Progress:</span>
          <span className="font-medium">{job.progressPercentage || 0}%</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${job.progressPercentage || 0}%` }}
          />
        </div>

        <div className="flex justify-between">
          <span>Items:</span>
          <span className="font-medium">
            {job.completedItems}/{job.totalItems}
            {job.failedItems > 0 && (
              <span className="text-red-600 ml-1">
                ({job.failedItems} failed)
              </span>
            )}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Created:</span>
          <span>{formatDate(job.createdAt)}</span>
        </div>

        {job.completedAt && (
          <div className="flex justify-between">
            <span>Completed:</span>
            <span>{formatDate(job.completedAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
