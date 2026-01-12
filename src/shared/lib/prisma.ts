// src/shared/lib/prisma.ts
// Singleton PrismaClient instance
// Used by ALL repositories throughout the application

import { PrismaClient } from '@prisma/client';
import { envConfig } from '../config/env';

// Extend the global type to include prisma
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create a function to initialize Prisma with proper configuration
function createPrismaClient(): PrismaClient {
  const isDevelopment = envConfig.isDevelopment();
  
  const client = new PrismaClient({
    log: isDevelopment 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    errorFormat: isDevelopment ? 'pretty' : 'minimal',
  });

  // Add lifecycle hooks for connection management
  client.$connect()
    .then(() => {
      if (isDevelopment) {
        console.log('✅ Database connected successfully');
      }
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    });

  return client;
}

// Singleton pattern: reuse connection in development (hot reload)
// In production, create a new instance each time
const prisma = global.prisma || createPrismaClient();

if (envConfig.isDevelopment()) {
  global.prisma = prisma;
}

// Graceful shutdown handler
const shutdownHandler = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdownHandler);
process.on('SIGTERM', shutdownHandler);

export default prisma;
export { prisma };
