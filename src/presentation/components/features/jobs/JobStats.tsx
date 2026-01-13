// src/presentation/components/features/jobs/JobStats.tsx
// Job statistics component

import React from 'react';
import { useJobs } from '@/presentation/hooks/jobs/useJobs';
import { Spinner } from '../../shared/Spinner';

export function JobStats() {
  const { jobs, isLoading, error } = useJobs();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Failed to load job statistics</p>
      </div>
    );
  }

  // Calculate statistics
  const totalJobs = jobs.length;
  const pendingJobs = jobs.filter(job => job.status === 'pending').length;
  const processingJobs = jobs.filter(job => job.status === 'processing').length;
  const completedJobs = jobs.filter(job => job.status === 'completed').length;
  const failedJobs = jobs.filter(job => job.status === 'failed').length;

  const totalItems = jobs.reduce((sum, job) => sum + job.totalItems, 0);
  const completedItems = jobs.reduce((sum, job) => sum + job.completedItems, 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalJobs}</div>
            <div className="text-sm text-gray-600">Total Jobs</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{completedJobs}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{pendingJobs}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{processingJobs}</div>
            <div className="text-sm text-gray-600">Processing</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Progress</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Total Items</div>
            <div className="font-medium">{totalItems}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Completed Items</div>
            <div className="font-medium text-green-600">{completedItems}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Completion Rate</div>
            <div className="font-medium">
              {totalItems > 0 ? `${Math.round((completedItems / totalItems) * 100)}%` : '0%'}
            </div>
          </div>
        </div>

        {failedJobs > 0 && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <span className="font-medium text-red-700">{failedJobs} failed jobs</span> need attention
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}