// src/shared/lib/logger.ts
// Logging system used throughout the application
// Provides structured logging with different levels and contexts

import { envConfig } from '../config/env';

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  private constructor() {
    const configLevel = envConfig.getLogLevel();
    this.logLevel = this.parseLogLevel(configLevel);
    this.isDevelopment = envConfig.isDevelopment();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug':
        return LogLevel.DEBUG;
      case 'info':
        return LogLevel.INFO;
      case 'warn':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatLogEntry(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Pretty format for development
      const emoji = this.getLevelEmoji(entry.level);
      let output = `${emoji} [${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
      
      if (entry.context && Object.keys(entry.context).length > 0) {
        output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
      }
      
      if (entry.error) {
        output += `\n  Error: ${entry.error.message}`;
        if (entry.error.stack) {
          output += `\n  Stack: ${entry.error.stack}`;
        }
      }
      
      return output;
    } else {
      // JSON format for production (easier to parse)
      return JSON.stringify(entry);
    }
  }

  private getLevelEmoji(level: string): string {
    switch (level.toLowerCase()) {
      case 'debug':
        return '🔍';
      case 'info':
        return 'ℹ️';
      case 'warn':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '📝';
    }
  }

  private log(level: LogLevel, levelName: string, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: levelName,
      message,
      context,
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    const formattedLog = this.formatLogEntry(entry);

    // Output to appropriate stream
    if (level >= LogLevel.ERROR) {
      console.error(formattedLog);
    } else if (level >= LogLevel.WARN) {
      console.warn(formattedLog);
    } else {
      console.log(formattedLog);
    }
  }

  public debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, 'debug', message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, 'info', message, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, 'warn', message, context);
  }

  public error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, 'error', message, context, error);
  }

  // Utility methods for specific contexts
  public jobLog(jobId: string, message: string, context?: LogContext): void {
    this.info(message, { ...context, jobId });
  }

  public itemLog(itemId: string, message: string, context?: LogContext): void {
    this.info(message, { ...context, itemId });
  }

  public apiLog(method: string, path: string, statusCode: number, duration?: number): void {
    this.info(`API Request`, {
      method,
      path,
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  public queueLog(queueName: string, message: string, context?: LogContext): void {
    this.info(message, { ...context, queue: queueName });
  }

  public workerLog(workerName: string, message: string, context?: LogContext): void {
    this.info(message, { ...context, worker: workerName });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
export default logger;
