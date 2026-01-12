// src/core/domain/value-objects/JobStatus.ts
// Enum + helpers for Job statuses
// Imported by Job entity

export enum JobStatus {
  DRAFT = 'DRAFT',                 // Not started yet
  VALIDATING = 'VALIDATING',       // Validation in progress
  READY = 'READY',                 // Validated, ready to start
  PROCESSING = 'PROCESSING',       // Generation in progress
  PAUSED = 'PAUSED',              // Manually paused
  COMPLETED = 'COMPLETED',         // Successfully completed
  FAILED = 'FAILED',              // Failed (non-recoverable errors)
  CANCELLED = 'CANCELLED',         // Cancelled by user
}

export class JobStatusHelper {
  // Check if job can be started
  static canStart(status: JobStatus): boolean {
    return [JobStatus.READY, JobStatus.DRAFT].includes(status);
  }

  // Check if job can be paused
  static canPause(status: JobStatus): boolean {
    return status === JobStatus.PROCESSING;
  }

  // Check if job can be resumed
  static canResume(status: JobStatus): boolean {
    return status === JobStatus.PAUSED;
  }

  // Check if job can be cancelled
  static canCancel(status: JobStatus): boolean {
    return [
      JobStatus.DRAFT,
      JobStatus.READY,
      JobStatus.VALIDATING,
      JobStatus.PROCESSING,
      JobStatus.PAUSED,
    ].includes(status);
  }

  // Check if job is in a terminal state (can't be modified)
  static isTerminal(status: JobStatus): boolean {
    return [
      JobStatus.COMPLETED,
      JobStatus.FAILED,
      JobStatus.CANCELLED,
    ].includes(status);
  }

  // Check if job is currently active (processing)
  static isActive(status: JobStatus): boolean {
    return [
      JobStatus.VALIDATING,
      JobStatus.PROCESSING,
    ].includes(status);
  }

  // Get display label for status
  static getLabel(status: JobStatus): string {
    const labels: Record<JobStatus, string> = {
      [JobStatus.DRAFT]: 'Draft',
      [JobStatus.VALIDATING]: 'Validating',
      [JobStatus.READY]: 'Ready',
      [JobStatus.PROCESSING]: 'Processing',
      [JobStatus.PAUSED]: 'Paused',
      [JobStatus.COMPLETED]: 'Completed',
      [JobStatus.FAILED]: 'Failed',
      [JobStatus.CANCELLED]: 'Cancelled',
    };
    return labels[status];
  }

  // Get color/variant for UI display
  static getVariant(status: JobStatus): 'default' | 'success' | 'warning' | 'error' | 'info' {
    const variants: Record<JobStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
      [JobStatus.DRAFT]: 'default',
      [JobStatus.VALIDATING]: 'info',
      [JobStatus.READY]: 'info',
      [JobStatus.PROCESSING]: 'info',
      [JobStatus.PAUSED]: 'warning',
      [JobStatus.COMPLETED]: 'success',
      [JobStatus.FAILED]: 'error',
      [JobStatus.CANCELLED]: 'default',
    };
    return variants[status];
  }

  // Validate status transition
  static isValidTransition(from: JobStatus, to: JobStatus): boolean {
    const validTransitions: Record<JobStatus, JobStatus[]> = {
      [JobStatus.DRAFT]: [JobStatus.VALIDATING, JobStatus.READY, JobStatus.CANCELLED],
      [JobStatus.VALIDATING]: [JobStatus.READY, JobStatus.FAILED, JobStatus.CANCELLED],
      [JobStatus.READY]: [JobStatus.PROCESSING, JobStatus.CANCELLED],
      [JobStatus.PROCESSING]: [JobStatus.PAUSED, JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED],
      [JobStatus.PAUSED]: [JobStatus.PROCESSING, JobStatus.CANCELLED],
      [JobStatus.COMPLETED]: [],
      [JobStatus.FAILED]: [],
      [JobStatus.CANCELLED]: [],
    };

    return validTransitions[from]?.includes(to) || false;
  }
}
