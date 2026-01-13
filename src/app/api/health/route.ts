// src/app/api/health/route.ts
// Health check endpoint

import { NextResponse } from 'next/server';
import { serviceProvider } from '@/infrastructure/di/ServiceProvider';
import { HealthCheckService } from '@/application/services/HealthCheckService';

export async function GET() {
  try {
    // Initialize services if not already initialized
    if (!serviceProvider.isInitialized()) {
      await serviceProvider.initialize();
    }

    // Get health check service
    const healthCheckService = serviceProvider.getService<HealthCheckService>('HealthCheckService');

    // Perform health check
    const healthCheck = await healthCheckService.performHealthCheck();

    return NextResponse.json({
      success: true,
      healthy: healthCheck.healthy,
      components: healthCheck.components,
      timestamp: healthCheck.timestamp,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    }, { status: 500 });
  }
}