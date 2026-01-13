// src/application/services/NotificationService.ts
// Service: Notification system for sending alerts and updates

import { IEventBus } from '@/core/ports/events/IEventBus';
import { IUserSettingsRepository } from '@/core/ports/repositories/IUserSettingsRepository';
import { JobCompletedEvent } from '@/core/domain/events/job/JobCompletedEvent';
import { JobFailedEvent } from '@/core/domain/events/job/JobFailedEvent';
import { ItemFailedEvent } from '@/core/domain/events/item/ItemFailedEvent';
import { ErrorOccurredEvent } from '@/core/domain/events/error/ErrorOccurredEvent';
import { UserSettings } from '@/core/domain/entities/UserSettings';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

export class NotificationService {
  constructor(
    private readonly eventBus: IEventBus,
    private readonly userSettingsRepository: IUserSettingsRepository
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for important events that should trigger notifications
    this.eventBus.subscribe(JobCompletedEvent.name, async (event: JobCompletedEvent) => {
      await this.handleJobCompleted(event);
    });

    this.eventBus.subscribe(JobFailedEvent.name, async (event: JobFailedEvent) => {
      await this.handleJobFailed(event);
    });

    this.eventBus.subscribe(ItemFailedEvent.name, async (event: ItemFailedEvent) => {
      await this.handleItemFailed(event);
    });

    this.eventBus.subscribe(ErrorOccurredEvent.name, async (event: ErrorOccurredEvent) => {
      await this.handleErrorOccurred(event);
    });
  }

  private async handleJobCompleted(event: JobCompletedEvent): Promise<void> {
    try {
      // Get user settings for notification preferences
      const userSettings = await this.getUserSettings();

      if (userSettings.notifyOnJobCompletion) {
        await this.sendNotification({
          userId: userSettings.userId,
          title: 'Job Completed',
          message: `Your job "${event.jobName || event.jobId}" has completed successfully.`,
          type: 'success',
          data: {
            jobId: event.jobId,
            completedItems: event.completedItems,
            totalItems: event.totalItems,
          },
        });
      }

    } catch (error) {
      console.error(`Failed to send job completion notification for job ${event.jobId}:`, error);
    }
  }

  private async handleJobFailed(event: JobFailedEvent): Promise<void> {
    try {
      // Get user settings for notification preferences
      const userSettings = await this.getUserSettings();

      if (userSettings.notifyOnJobFailure) {
        await this.sendNotification({
          userId: userSettings.userId,
          title: 'Job Failed',
          message: `Your job "${event.jobId}" has failed: ${event.error}`,
          type: 'error',
          data: {
            jobId: event.jobId,
            error: event.error,
          },
        });
      }

    } catch (error) {
      console.error(`Failed to send job failure notification for job ${event.jobId}:`, error);
    }
  }

  private async handleItemFailed(event: ItemFailedEvent): Promise<void> {
    try {
      // Get user settings for notification preferences
      const userSettings = await this.getUserSettings();

      // Only notify for item failures if configured and it's a significant failure
      if (userSettings.notifyOnItemFailure && event.retryCount >= 3) {
        await this.sendNotification({
          userId: userSettings.userId,
          title: 'Item Processing Failed',
          message: `Item ${event.itemId} in job ${event.jobId} failed after ${event.retryCount} retries: ${event.error}`,
          type: 'warning',
          data: {
            jobId: event.jobId,
            itemId: event.itemId,
            error: event.error,
            retryCount: event.retryCount,
          },
        });
      }

    } catch (error) {
      console.error(`Failed to send item failure notification for item ${event.itemId}:`, error);
    }
  }

  private async handleErrorOccurred(event: ErrorOccurredEvent): Promise<void> {
    try {
      // Get user settings for notification preferences
      const userSettings = await this.getUserSettings();

      // Only notify for critical errors
      if (userSettings.notifyOnErrors && event.errorType === 'critical') {
        await this.sendNotification({
          userId: userSettings.userId,
          title: 'Critical Error Occurred',
          message: `A critical error occurred: ${event.errorMessage}`,
          type: 'error',
          data: {
            errorId: event.errorId,
            errorType: event.errorType,
            errorMessage: event.errorMessage,
            context: event.context,
          },
        });
      }

    } catch (error) {
      console.error(`Failed to send error notification for error ${event.errorId}:`, error);
    }
  }

  private async getUserSettings(): Promise<UserSettings> {
    // In a real app, you would get the user ID from auth context
    const userId = 'current-user'; // Placeholder

    let settings = await this.userSettingsRepository.findByUserId(userId);

    if (!settings) {
      // Create default settings if none exist
      settings = UserSettings.create({
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        notifyOnJobCompletion: true,
        notifyOnJobFailure: true,
        notifyOnItemFailure: false,
        notifyOnErrors: true,
      });

      await this.userSettingsRepository.save(settings);
    }

    return settings;
  }

  public async sendNotification(notification: {
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    data?: any;
    channel?: 'email' | 'webhook' | 'sms' | 'in-app';
  }): Promise<void> {
    try {
      // In a real implementation, this would send notifications via various channels
      // For now, we'll just log it and simulate sending

      console.log(`[NOTIFICATION] ${notification.type.toUpperCase()}: ${notification.title}`);
      console.log(`Message: ${notification.message}`);
      console.log(`Data:`, notification.data);

      // Simulate different notification channels based on user preferences
      const userSettings = await this.getUserSettings();

      if (userSettings.notificationChannels?.includes('email')) {
        await this.sendEmailNotification(notification);
      }

      if (userSettings.notificationChannels?.includes('webhook')) {
        await this.sendWebhookNotification(notification);
      }

      if (userSettings.notificationChannels?.includes('sms')) {
        await this.sendSmsNotification(notification);
      }

      // Always send in-app notification
      await this.sendInAppNotification(notification);

    } catch (error) {
      console.error(`Failed to send notification:`, error);
      throw ErrorFactory.notificationError('Failed to send notification', error);
    }
  }

  private async sendEmailNotification(notification: any): Promise<void> {
    // In a real implementation, this would integrate with an email service
    console.log(`[EMAIL] Sending email notification to user ${notification.userId}`);
    console.log(`Subject: ${notification.title}`);
    console.log(`Body: ${notification.message}`);
  }

  private async sendWebhookNotification(notification: any): Promise<void> {
    // In a real implementation, this would call a webhook URL
    console.log(`[WEBHOOK] Sending webhook notification for user ${notification.userId}`);
    console.log(`Payload:`, JSON.stringify(notification, null, 2));
  }

  private async sendSmsNotification(notification: any): Promise<void> {
    // In a real implementation, this would integrate with an SMS service
    console.log(`[SMS] Sending SMS notification to user ${notification.userId}`);
    console.log(`Message: ${notification.title}: ${notification.message}`);
  }

  private async sendInAppNotification(notification: any): Promise<void> {
    // In a real implementation, this would store the notification in the database
    // for the user to see when they next log in
    console.log(`[IN-APP] Storing in-app notification for user ${notification.userId}`);
    console.log(`Notification:`, notification);
  }

  public async getNotificationHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    notifications: Array<{
      id: string;
      title: string;
      message: string;
      type: string;
      read: boolean;
      createdAt: Date;
      data?: any;
    }>;
    total: number;
  }> {
    try {
      // In a real implementation, this would fetch from a notifications repository
      // For now, return a mock response

      const mockNotifications = [
        {
          id: 'notif-1',
          title: 'Job Completed',
          message: 'Your job "Marketing Content" has completed successfully.',
          type: 'success',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          data: { jobId: 'job-123', completedItems: 10, totalItems: 10 },
        },
        {
          id: 'notif-2',
          title: 'Job Started',
          message: 'Your job "Product Descriptions" has started processing.',
          type: 'info',
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          data: { jobId: 'job-456' },
        },
      ];

      return {
        notifications: mockNotifications.slice(offset, offset + limit),
        total: mockNotifications.length,
      };

    } catch (error) {
      console.error(`Failed to get notification history for user ${userId}:`, error);
      throw ErrorFactory.notificationError('Failed to get notification history', error);
    }
  }

  public async markNotificationAsRead(
    userId: string,
    notificationId: string
  ): Promise<void> {
    try {
      // In a real implementation, this would update the notification in the database
      console.log(`[NOTIFICATION] Marking notification ${notificationId} as read for user ${userId}`);

    } catch (error) {
      console.error(`Failed to mark notification ${notificationId} as read:`, error);
      throw ErrorFactory.notificationError('Failed to mark notification as read', error);
    }
  }

  public async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      // In a real implementation, this would update all notifications in the database
      console.log(`[NOTIFICATION] Marking all notifications as read for user ${userId}`);

    } catch (error) {
      console.error(`Failed to mark all notifications as read for user ${userId}:`, error);
      throw ErrorFactory.notificationError('Failed to mark all notifications as read', error);
    }
  }

  public async cleanupOldNotifications(maxAgeDays: number = 30): Promise<number> {
    try {
      // In a real implementation, this would delete old notifications
      console.log(`[NOTIFICATION] Cleaning up notifications older than ${maxAgeDays} days`);

      // Return mock count
      return 42;

    } catch (error) {
      console.error('Failed to cleanup old notifications:', error);
      throw ErrorFactory.notificationError('Failed to cleanup old notifications', error);
    }
  }
}