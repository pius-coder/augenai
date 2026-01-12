// src/infrastructure/di/ServiceProvider.ts
// Provides service initialization and lifecycle management

import { container } from './Container';
import { initializeQueues } from './config/queue.config';
import { createServiceConfig, initializeServices } from './config/services.config';
import { logger } from '@/shared/lib/logger';
import { IEventBus } from '@/core/ports/events/IEventBus';

export class ServiceProvider {
  private static instance: ServiceProvider;
  private initialized = false;
  private servicesInitialized = false;
  private queuesInitialized = false;

  private constructor() {}

  static getInstance(): ServiceProvider {
    if (!ServiceProvider.instance) {
      ServiceProvider.instance = new ServiceProvider();
    }
    return ServiceProvider.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('Services already initialized');
      return;
    }

    try {
      logger.info('Initializing services...');
      
      // Load configuration
      const config = createServiceConfig();
      
      // Initialize core services
      await this.initializeCoreServices(config);
      
      // Initialize event handlers
      await this.initializeEventHandlers();
      
      // Initialize queue workers
      await this.initializeWorkers();
      
      this.initialized = true;
      logger.info('All services initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize services', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async initializeCoreServices(config: ReturnType<typeof createServiceConfig>): Promise<void> {
    if (this.servicesInitialized) return;
    
    logger.info('Initializing core services...');
    
    // Initialize service implementations
    const services = initializeServices(config);
    
    // Initialize queues
    const queues = initializeQueues();
    this.queuesInitialized = true;
    
    logger.info('Core services initialized', {
      services: Object.keys(services),
      queues: Object.keys(queues),
    });
    
    this.servicesInitialized = true;
  }

  private async initializeEventHandlers(): Promise<void> {
    logger.info('Initializing event handlers...');
    
    const eventBus = container.get<IEventBus>('IEventBus');
    
    // Register domain event handlers
    eventBus.subscribe('job.*', (event) => {
      logger.debug('Job event received', { event: event.type });
    });
    
    eventBus.subscribe('item.*', (event) => {
      logger.debug('Item event received', { event: event.type });
    });
    
    eventBus.subscribe('chunk.*', (event) => {
      logger.debug('Chunk event received', { event: event.type });
    });
    
    eventBus.subscribe('error.*', (event) => {
      logger.warn('Error event received', { event: event.type, data: event.data });
    });
    
    eventBus.subscribe('completion', (event) => {
      logger.info('Completion event received', { event: event.type });
    });
    
    logger.info('Event handlers registered');
  }

  private async initializeWorkers(): Promise<void> {
    logger.info('Initializing queue workers...');
    
    const jobQueue = container.get('IJobQueue');
    const itemQueue = container.get('IItemQueue');
    const processItemQueue = container.get('IProcessItemQueue');
    
    // Start job queue worker
    jobQueue.startWorker(async (job) => {
      logger.debug('Processing job from queue', { jobId: job.id });
      // Job processing logic would go here
      return { success: true };
    });
    
    // Start item queue worker
    itemQueue.startWorker(async (item) => {
      logger.debug('Processing item from queue', { itemId: item.id });
      // Item processing logic would go here
      return { success: true };
    });
    
    // Start process item queue worker
    processItemQueue.startWorker(async (processItem) => {
      logger.debug('Processing process item from queue', { itemId: processItem.id });
      // Process item logic would go here
      return { success: true };
    });
    
    logger.info('Queue workers started');
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      logger.warn('Services not initialized, cannot shutdown');
      return;
    }
    
    logger.info('Shutting down services...');
    
    try {
      // Stop queue workers
      if (this.queuesInitialized) {
        const jobQueue = container.get('IJobQueue');
        const itemQueue = container.get('IItemQueue');
        const processItemQueue = container.get('IProcessItemQueue');
        
        await jobQueue.stopWorker();
        await itemQueue.stopWorker();
        await processItemQueue.stopWorker();
        
        logger.info('Queue workers stopped');
      }
      
      // Close database connections
      const prisma = container.get<PrismaClient>('PrismaClient');
      await prisma.$disconnect();
      
      logger.info('Database connections closed');
      logger.info('Services shutdown complete');
      
    } catch (error) {
      logger.error('Error during shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      this.initialized = false;
    }
  }

  getContainer() {
    return container;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getService<T>(name: string): T {
    if (!this.initialized) {
      logger.warn('Getting service before initialization');
    }
    return container.get<T>(name);
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    services: Record<string, boolean>;
    errors: string[];
  }> {
    const errors: string[] = [];
    const services: Record<string, boolean> = {};
    
    try {
      // Check database connection
      const prisma = container.get('PrismaClient');
      await prisma.$queryRaw`SELECT 1`;
      services.database = true;
    } catch (error) {
      services.database = false;
      errors.push(`Database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Check event bus
    try {
      const eventBus = container.get<IEventBus>('IEventBus');
      services.eventBus = true;
    } catch (error) {
      services.eventBus = false;
      errors.push(`EventBus: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Check queues
    try {
      container.get('IJobQueue');
      container.get('IItemQueue');
      container.get('IProcessItemQueue');
      services.queues = true;
    } catch (error) {
      services.queues = false;
      errors.push(`Queues: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    const healthy = errors.length === 0;
    
    return {
      healthy,
      services,
      errors,
    };
  }
}

// Global service provider instance
export const serviceProvider = ServiceProvider.getInstance();

// Convenience function for quick setup
export async function setupServices(): Promise<ServiceProvider> {
  const provider = ServiceProvider.getInstance();
  await provider.initialize();
  return provider;
}