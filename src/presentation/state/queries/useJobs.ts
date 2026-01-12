// src/presentation/state/queries/useJobs.ts
// React Query hook for fetching jobs

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Job } from '@/core/domain/entities/Job';
import { JobStatus } from '@/core/domain/value-objects/JobStatus';

interface JobListParams {
  status?: JobStatus;
  limit?: number;
  offset?: number;
  order?: 'asc' | 'desc';
}

interface JobListResponse {
  success: boolean;
  data: {
    jobs: any[];
    total: number;
    limit: number;
    offset: number;
  };
}

interface JobResponse {
  success: boolean;
  data: any;
}

async function fetchJobs(params: JobListParams = {}): Promise<JobListResponse> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());
  if (params.order) searchParams.set('order', params.order);

  const response = await fetch(`/api/jobs?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch jobs');
  }
  return response.json();
}

async function fetchJob(jobId: string): Promise<JobResponse> {
  const response = await fetch(`/api/jobs/${jobId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch job');
  }
  return response.json();
}

async function createJob(data: any): Promise<JobResponse> {
  const response = await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create job');
  }
  return response.json();
}

async function updateJob(jobId: string, data: any): Promise<JobResponse> {
  const response = await fetch(`/api/jobs/${jobId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update job');
  }
  return response.json();
}

async function deleteJob(jobId: string): Promise<JobResponse> {
  const response = await fetch(`/api/jobs/${jobId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete job');
  }
  return response.json();
}

export function useJobs(params: JobListParams = {}) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: () => fetchJobs(params),
  });
}

export function useJob(jobId: string) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => fetchJob(jobId),
    enabled: !!jobId,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: any }) =>
      updateJob(jobId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
