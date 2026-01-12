// src/presentation/components/jobs/JobsList.tsx
// Jobs list component with pagination

'use client';

import React from 'react';
import { useJobs } from '@/presentation/state/queries/useJobs';
import { JobCard } from './JobCard';
import { useRouter } from 'next/navigation';

interface JobsListProps {
  status?: string;
  limit?: number;
  offset?: number;
}

export function JobsList({ status, limit = 20, offset = 0 }: JobsListProps) {
  const router = useRouter();
  const { data, isLoading, error } = useJobs({ status: status as any, limit, offset });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p>Error loading jobs: {error.message}</p>
      </div>
    );
  }

  if (!data?.data?.jobs || data.data.jobs.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
        <p className="text-lg mb-2">No jobs found</p>
        <p className="text-sm">Create your first job to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.data.jobs.map((job: any) => (
        <JobCard
          key={job.id}
          job={job}
          onClick={() => router.push(`/jobs/${job.id}`)}
        />
      ))}

      {data.data.total > limit && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            disabled={offset === 0}
            onClick={() => router.push(`?offset=${Math.max(0, offset - limit)}`)}
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {Math.floor(offset / limit) + 1} of{' '}
            {Math.ceil(data.data.total / limit)}
          </span>
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            disabled={offset + limit >= data.data.total}
            onClick={() => router.push(`?offset=${offset + limit}`)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
