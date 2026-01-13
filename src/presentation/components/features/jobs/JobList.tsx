// src/presentation/components/features/jobs/JobList.tsx
// Job list component showing all jobs

import React from 'react';
import { JobCard } from './JobCard';
import { useJobs } from '@/presentation/hooks/jobs/useJobs';
import { Spinner } from '../../shared/Spinner';
import { EmptyState } from '../../shared/EmptyState';

export function JobList() {
  const { jobs, isLoading, error } = useJobs();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-red-600">
        <p>Failed to load jobs: {error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry
        </button>
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <EmptyState
        title="No Jobs Found"
        description="Create your first job to get started with audio generation"
        action={(
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Job
          </button>
        )}
      />
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}