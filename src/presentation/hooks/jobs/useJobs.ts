// src/presentation/hooks/jobs/useJobs.ts
// Hook for fetching and managing jobs

import { useQuery } from '@tanstack/react-query';
import { ListJobsUseCase } from '@/core/domain/use-cases/job/ListJobsUseCase';
import { container } from '@/infrastructure/di/Container';
import { Job } from '@/core/domain/entities/Job';

export function useJobs() {
  const listJobsUseCase = container.get<ListJobsUseCase>('ListJobsUseCase');

  const { 
    data: jobs, 
    isLoading, 
    error, 
    refetch, 
  } = useQuery<Job[], Error>({
    queryKey: ['jobs'],
    queryFn: async () => {
      const result = await listJobsUseCase.execute({});
      return result.jobs;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  return {
    jobs: jobs || [],
    isLoading,
    error,
    refetch,
  };
}