// src/presentation/state/stores/jobsStore.ts
// Zustand store for jobs list management

import { create } from 'zustand';
import { Job } from '@/core/domain/entities/Job';
import { JobStatus } from '@/core/domain/value-objects/JobStatus';

interface JobsState {
  jobs: Job[];
  selectedJobId: string | null;
  filters: {
    status?: JobStatus;
    search?: string;
  };
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
  isLoading: boolean;
  error: string | null;
}

interface JobsActions {
  setJobs: (jobs: Job[]) => void;
  addJob: (job: Job) => void;
  updateJob: (jobId: string, updates: Partial<Job>) => void;
  removeJob: (jobId: string) => void;
  selectJob: (jobId: string | null) => void;
  setFilters: (filters: Partial<JobsState['filters']>) => void;
  setPagination: (pagination: Partial<JobsState['pagination']>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: JobsState = {
  jobs: [],
  selectedJobId: null,
  filters: {},
  pagination: {
    limit: 20,
    offset: 0,
    total: 0,
  },
  isLoading: false,
  error: null,
};

export const useJobsStore = create<JobsState & JobsActions>((set) => ({
  ...initialState,

  setJobs: (jobs) => set({ jobs }),

  addJob: (job) =>
    set((state) => ({
      jobs: [job, ...state.jobs],
      pagination: { ...state.pagination, total: state.pagination.total + 1 },
    })),

  updateJob: (jobId, updates) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId ? { ...job, ...updates } : job
      ),
    })),

  removeJob: (jobId) =>
    set((state) => ({
      jobs: state.jobs.filter((job) => job.id !== jobId),
      pagination: { ...state.pagination, total: state.pagination.total - 1 },
    })),

  selectJob: (jobId) => set({ selectedJobId: jobId }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, offset: 0 },
    })),

  setPagination: (pagination) =>
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
