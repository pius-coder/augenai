// src/application/services/HealthCheckService.ts
// Service: System health monitoring and checks

import { IJobRepository } from '@/core/ports/repositories/IJobRepository';
import { IContentItemRepository } from '@/core/ports/repositories/IContentItemRepository';
import { IQueueManager } from '@/core/ports/queue/IQueueManager';
import { IEventBus } from '@/core/ports/events/IEventBus';
import { IErrorLogRepository } from '@/core/ports/repositories/IErrorLogRepository';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export class HealthCheckService {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly contentItemRepository: IContentItemRepository,
    private readonly queueManager: IQueueManager,
    private readonly eventBus: IEventBus,
    private readonly errorLogRepository: IErrorLogRepository
  ) {}

  public async performHealthCheck(): Promise<{
    healthy: boolean;
    components: Record<string, {
      healthy: boolean;
      message?: string;
      details?: any;
    }>;
    timestamp: Date;
  }> {
    const components: Record<string, { healthy: boolean; message?: string; details?: any }> = {};
    const timestamp = new Date();

    try {
      // Check database connectivity
      components.database = await this.checkDatabase();

      // Check repositories
      components.repositories = await this.checkRepositories();

      // Check queue system
      components.queues = await this.checkQueues();

      // Check event bus
      components.eventBus = await this.checkEventBus();

      // Check error logs
      components.errorLogs = await this.checkErrorLogs();

      // Overall health status
      const healthy = Object.values(components).every(c => c.healthy);

      return {
        healthy,
        components,
        timestamp,
      };

    } catch (error) {
      console.error('Health check failed:', error);
      
      return {
        healthy: false,
        components: {
          ...components,
          healthCheck: {
            healthy: false,
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        },
        timestamp,
      };
    }
  }

  private async checkDatabase(): Promise<{ healthy: boolean; message?: string }> {
    try {
      // Test database connection by counting jobs
      const count = await this.jobRepository.count();
      return {
        healthy: true,
        message: `Database connection OK (${count} jobs)`,
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  }

  private async checkRepositories(): Promise<{ healthy: boolean; details: Record<string, boolean> }> {
    const details: Record<string, boolean> = {};

    try {
      // Test job repository
      const jobCount = await this.jobRepository.count();
      details.jobRepository = jobCount >= 0;

      // Test content item repository
      const itemCount = await this.contentItemRepository.count();
      details.contentItemRepository = itemCount >= 0;

      // Test error log repository
      const errorCount = await this.errorLogRepository.count();
      details.errorLogRepository = errorCount >= 0;

      const healthy = Object.values(details).every(Boolean);

      return {
        healthy,
        details,
      };

    } catch (error) {
      return {
        healthy: false,
        details: {
          ...details,
          error: error instanceof Error ? error.message : 'Repository check failed',
        },
      };
    }
  }

  private async checkQueues(): Promise<{ healthy: boolean; details: Record<string, any> }> {
    const details: Record<string, any> = {};

    try {
      // Get queue status
      const jobQueueStatus = await this.queueManager.getQueueStatus('job');
      const itemQueueStatus = await this.queueManager.getQueueStatus('item');
      const audioQueueStatus = await this.queueManager.getQueueStatus('audio');
      const mergeQueueStatus = await this.queueManager.getQueueStatus('merge');

      details.jobQueue = {
        healthy: jobQueueStatus.active,
        pending: jobQueueStatus.pending,
        completed: jobQueueStatus.completed,
        failed: jobQueueStatus.failed,
      };

      details.itemQueue = {
        healthy: itemQueueStatus.active,
        pending: itemQueueStatus.pending,
        completed: itemQueueStatus.completed,
        failed: itemQueueStatus.failed,
      };

      details.audioQueue = {
        healthy: audioQueueStatus.active,
        pending: audioQueueStatus.pending,
        completed: audioQueueStatus.completed,
        failed: audioQueueStatus.failed,
      };

      details.mergeQueue = {
        healthy: mergeQueueStatus.active,
        pending: mergeQueueStatus.pending,
        completed: mergeQueueStatus.completed,
        failed: mergeQueueStatus.failed,
      };

      const healthy = Object.values(details).every((q: any) => q.healthy);

      return {
        healthy,
        details,
      };

    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : 'Queue check failed',
        },
      };
    }
  }

  private async checkEventBus(): Promise<{ healthy: boolean; message?: string }> {
    try {
      // Test event bus by publishing and subscribing to a test event
      let eventReceived = false;
      
      const testEvent = {
        type: 'health_check_test',
        data: { timestamp: new Date() },
      };

      // Subscribe to test event
      const subscription = this.eventBus.subscribe(testEvent.type, () => {
        eventReceived = true;
      });

      // Publish test event
      await this.eventBus.publish(testEvent);

      // Wait a bit for event to be received
      await new Promise(resolve => setTimeout(resolve, 100));

      // Unsubscribe
      subscription.unsubscribe();

      if (eventReceived) {
        return {
          healthy: true,
          message: 'Event bus working correctly',
        };
      } else {
        return {
          healthy: false,
          message: 'Event bus not receiving events',
        };
      }

    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Event bus check failed',
      };
    }
  }

  private async checkErrorLogs(): Promise<{ healthy: boolean; details: any }> {
    try {
      // Get recent error stats
      const recentErrors = await this.errorLogRepository.findRecentErrors(7); // Last 7 days
      
      const criticalErrors = recentErrors.filter(e => 
        e.type === 'critical' || e.status === 'failed'
      );

      return {
        healthy: criticalErrors.length === 0,
        details: {
          totalRecentErrors: recentErrors.length,
          criticalErrors: criticalErrors.length,
          failedErrors: recentErrors.filter(e => e.status === 'failed').length,
          pendingRetries: recentErrors.filter(e => e.status === 'retry_scheduled').length,
        },
      };

    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : 'Error log check failed',
        },
      };
    }
  }

  public async getSystemMetrics(): Promise<{
    jobs: {
      total: number;
      pending: number;
      processing: number;
      completed: number;
      failed: number;
    };
    items: {
      total: number;
      pending: number;
      processing: number;
      completed: number;
      failed: number;
    };
    queues: {
      job: number;
      item: number;
      audio: number;
      merge: number;
    };
    timestamp: Date;
  }> {
    try {
      // Get job metrics
      const jobs = await this.jobRepository.findAll();
      const pendingJobs = jobs.filter(j => j.status === 'pending').length;
      const processingJobs = jobs.filter(j => j.status === 'processing').length;
      const completedJobs = jobs.filter(j => j.status === 'completed').length;
      const failedJobs = jobs.filter(j => j.status === 'failed').length;

      // Get item metrics
      const items = await this.contentItemRepository.findAll();
      const pendingItems = items.filter(i => i.status === 'pending').length;
      const processingItems = items.filter(i => i.status === 'processing').length;
      const completedItems = items.filter(i => i.status === 'completed').length;
      const failedItems = items.filter(i => i.status === 'failed').length;

      // Get queue metrics
      const jobQueueStatus = await this.queueManager.getQueueStatus('job');
      const itemQueueStatus = await this.queueManager.getQueueStatus('item');
      const audioQueueStatus = await this.queueManager.getQueueStatus('audio');
      const mergeQueueStatus = await this.queueManager.getQueueStatus('merge');

      return {
        jobs: {
          total: jobs.length,
          pending: pendingJobs,
          processing: processingJobs,
          completed: completedJobs,
          failed: failedJobs,
        },
        items: {
          total: items.length,
          pending: pendingItems,
          processing: processingItems,
          completed: completedItems,
          failed: failedItems,
        },
        queues: {
          job: jobQueueStatus.pending,
          item: itemQueueStatus.pending,
          audio: audioQueueStatus.pending,
          merge: mergeQueueStatus.pending,
        },
        timestamp: new Date(),
      };

    } catch (error) {
      console.error('Failed to get system metrics:', error);
      throw ErrorFactory.healthCheckError('Failed to get system metrics', error);
    }
  }

  public async checkCriticalComponents(): Promise<{
    critical: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Check for failed jobs
      const failedJobs = await this.jobRepository.findFailedJobs();
      if (failedJobs.length > 0) {
        issues.push(`Found ${failedJobs.length} failed jobs`);
      }

      // Check for failed items
      const failedItems = await this.contentItemRepository.findFailedItems();
      if (failedItems.length > 0) {
        issues.push(`Found ${failedItems.length} failed items`);
      }

      // Check for critical errors
      const criticalErrors = await this.errorLogRepository.findCriticalErrors();
      if (criticalErrors.length > 0) {
        issues.push(`Found ${criticalErrors.length} critical errors`);
      }

      // Check queue backlogs
      const jobQueueStatus = await this.queueManager.getQueueStatus('job');
      if (jobQueueStatus.pending > 100) {
        issues.push(`Job queue backlog: ${jobQueueStatus.pending} pending jobs`);
      }

      const itemQueueStatus = await this.queueManager.getQueueStatus('item');
      if (itemQueueStatus.pending > 500) {
        issues.push(`Item queue backlog: ${itemQueueStatus.pending} pending items`);
      }

      return {
        critical: issues.length > 0,
        issues,
      };

    } catch (error) {
      console.error('Critical component check failed:', error);
      throw ErrorFactory.healthCheckError('Critical component check failed', error);
    }
  }
}