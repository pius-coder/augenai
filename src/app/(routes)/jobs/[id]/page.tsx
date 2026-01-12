// src/app/(routes)/jobs/[id]/page.tsx
// Job detail page

'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useJob, useDeleteJob } from '@/presentation/state/queries/useJobs';
import Link from 'next/link';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { data, isLoading, error } = useJob(jobId);
  const deleteJob = useDeleteJob();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to cancel this job?')) return;
    
    try {
      await deleteJob.mutateAsync(jobId);
      router.push('/jobs');
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p>Error loading job: {error?.message || 'Job not found'}</p>
        </div>
      </div>
    );
  }

  const job = data.data;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/jobs" className="text-blue-600 hover:underline">
          ← Back to Jobs
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{job.name}</h1>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
              {job.status}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleteJob.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleteJob.isPending ? 'Cancelling...' : 'Cancel Job'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Progress</h3>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${job.progressPercentage || 0}%` }}
              />
            </div>
            <p className="text-2xl font-semibold">{job.progressPercentage || 0}%</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Items</h3>
            <p className="text-2xl font-semibold">
              {job.completedItems} / {job.totalItems}
            </p>
            {job.failedItems > 0 && (
              <p className="text-red-600 text-sm">
                {job.failedItems} failed
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Created At</h3>
            <p>{new Date(job.createdAt).toLocaleString()}</p>
          </div>

          {job.startedAt && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Started At</h3>
              <p>{new Date(job.startedAt).toLocaleString()}</p>
            </div>
          )}

          {job.completedAt && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Completed At</h3>
              <p>{new Date(job.completedAt).toLocaleString()}</p>
            </div>
          )}

          {job.systemPrompt && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">System Prompt</h3>
              <p className="text-sm bg-gray-50 p-3 rounded">{job.systemPrompt}</p>
            </div>
          )}

          {job.userPromptTemplate && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">User Prompt Template</h3>
              <p className="text-sm bg-gray-50 p-3 rounded">{job.userPromptTemplate.template}</p>
            </div>
          )}

          {job.voiceSettings && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Voice Settings</h3>
              <div className="text-sm bg-gray-50 p-3 rounded space-y-1">
                <p><strong>Voice ID:</strong> {job.voiceSettings.voiceId}</p>
                {job.voiceSettings.stability !== undefined && (
                  <p><strong>Stability:</strong> {job.voiceSettings.stability}</p>
                )}
                {job.voiceSettings.similarityBoost !== undefined && (
                  <p><strong>Similarity Boost:</strong> {job.voiceSettings.similarityBoost}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
