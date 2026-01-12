// src/shared/utils/errors/ErrorFactory.ts
// Factory for creating typed errors
// Used by all services to throw consistent, typed errors

import {
  AppError,
  ValidationError,
  NotFoundError,
  DatabaseError,
  APIError,
  RateLimitError,
  FileError,
  CSVError,
  JobError,
  PipelineError,
  TextGenerationError,
  AudioGenerationError,
  ConfigurationError,
  ErrorCode,
  ErrorMetadata,
} from './AppError';

export class ErrorFactory {
  // General errors
  static unknown(message: string, metadata?: ErrorMetadata): AppError {
    return new AppError(message, ErrorCode.UNKNOWN_ERROR, 500, false, metadata);
  }

  static validation(message: string, metadata?: ErrorMetadata): ValidationError {
    return new ValidationError(message, metadata);
  }

  static notFound(resource: string, id: string, metadata?: ErrorMetadata): NotFoundError {
    return new NotFoundError(resource, id, metadata);
  }

  // Database errors
  static database(message: string, metadata?: ErrorMetadata): DatabaseError {
    return new DatabaseError(message, metadata);
  }

  static duplicate(resource: string, field: string, value: string): AppError {
    return new AppError(
      `${resource} with ${field} '${value}' already exists`,
      ErrorCode.DUPLICATE_ERROR,
      409,
      true,
      { resource, field, value }
    );
  }

  // External service errors
  static apiError(service: string, message: string, metadata?: ErrorMetadata): APIError {
    return new APIError(service, message, metadata);
  }

  static rateLimit(service: string, retryAfter?: number, metadata?: ErrorMetadata): RateLimitError {
    return new RateLimitError(service, retryAfter, metadata);
  }

  static serviceUnavailable(service: string, metadata?: ErrorMetadata): AppError {
    return new AppError(
      `Service ${service} is currently unavailable`,
      ErrorCode.SERVICE_UNAVAILABLE,
      503,
      true,
      { ...metadata, service }
    );
  }

  static timeout(operation: string, timeoutMs: number, metadata?: ErrorMetadata): AppError {
    return new AppError(
      `Operation '${operation}' timed out after ${timeoutMs}ms`,
      ErrorCode.TIMEOUT,
      408,
      true,
      { ...metadata, operation, timeoutMs }
    );
  }

  // File/Storage errors
  static fileNotFound(filePath: string, metadata?: ErrorMetadata): FileError {
    return new FileError(
      `File not found: ${filePath}`,
      ErrorCode.FILE_NOT_FOUND,
      { ...metadata, filePath }
    );
  }

  static fileTooLarge(fileName: string, size: number, maxSize: number): FileError {
    return new FileError(
      `File '${fileName}' is too large (${size} bytes). Maximum allowed: ${maxSize} bytes`,
      ErrorCode.FILE_TOO_LARGE,
      { fileName, size, maxSize }
    );
  }

  static invalidFileType(fileName: string, actualType: string, expectedTypes: string[]): FileError {
    return new FileError(
      `Invalid file type for '${fileName}'. Expected: ${expectedTypes.join(', ')}, got: ${actualType}`,
      ErrorCode.INVALID_FILE_TYPE,
      { fileName, actualType, expectedTypes }
    );
  }

  static storageError(message: string, metadata?: ErrorMetadata): FileError {
    return new FileError(message, ErrorCode.STORAGE_ERROR, metadata);
  }

  // CSV/Parsing errors
  static csvParseError(message: string, line?: number, metadata?: ErrorMetadata): CSVError {
    return new CSVError(
      `CSV parse error${line ? ` at line ${line}` : ''}: ${message}`,
      ErrorCode.CSV_PARSE_ERROR,
      { ...metadata, line }
    );
  }

  static invalidCSVFormat(message: string, metadata?: ErrorMetadata): CSVError {
    return new CSVError(message, ErrorCode.INVALID_CSV_FORMAT, metadata);
  }

  static missingRequiredColumn(column: string, availableColumns: string[]): CSVError {
    return new CSVError(
      `Missing required column '${column}'. Available columns: ${availableColumns.join(', ')}`,
      ErrorCode.MISSING_REQUIRED_COLUMN,
      { column, availableColumns }
    );
  }

  // Job/Pipeline errors
  static jobNotFound(jobId: string): JobError {
    return new JobError(
      `Job with id '${jobId}' not found`,
      ErrorCode.JOB_NOT_FOUND,
      { jobId }
    );
  }

  static jobAlreadyStarted(jobId: string): JobError {
    return new JobError(
      `Job '${jobId}' has already been started`,
      ErrorCode.JOB_ALREADY_STARTED,
      { jobId }
    );
  }

  static jobAlreadyCompleted(jobId: string): JobError {
    return new JobError(
      `Job '${jobId}' has already been completed`,
      ErrorCode.JOB_ALREADY_COMPLETED,
      { jobId }
    );
  }

  static itemNotFound(itemId: string): JobError {
    return new JobError(
      `Content item with id '${itemId}' not found`,
      ErrorCode.ITEM_NOT_FOUND,
      { itemId }
    );
  }

  static invalidStep(currentStep: string, expectedStep: string, itemId?: string): JobError {
    return new JobError(
      `Invalid step. Current: ${currentStep}, Expected: ${expectedStep}`,
      ErrorCode.INVALID_STEP,
      { currentStep, expectedStep, itemId }
    );
  }

  // Pipeline errors
  static pipelineError(step: string, message: string, metadata?: ErrorMetadata): PipelineError {
    return new PipelineError(message, step, metadata);
  }

  // AI/TTS errors
  static textGenerationError(message: string, itemId?: string, metadata?: ErrorMetadata): TextGenerationError {
    return new TextGenerationError(message, { ...metadata, itemId });
  }

  static audioGenerationError(message: string, chunkId?: string, metadata?: ErrorMetadata): AudioGenerationError {
    return new AudioGenerationError(message, { ...metadata, chunkId });
  }

  static chunkError(message: string, chunkId: string, metadata?: ErrorMetadata): AppError {
    return new AppError(
      `Chunk error for '${chunkId}': ${message}`,
      ErrorCode.CHUNK_ERROR,
      500,
      true,
      { ...metadata, chunkId }
    );
  }

  static mergeError(message: string, itemId: string, metadata?: ErrorMetadata): AppError {
    return new AppError(
      `Audio merge error for item '${itemId}': ${message}`,
      ErrorCode.MERGE_ERROR,
      500,
      true,
      { ...metadata, itemId }
    );
  }

  // Configuration errors
  static missingConfig(configKey: string, metadata?: ErrorMetadata): ConfigurationError {
    return new ConfigurationError(
      `Missing required configuration: ${configKey}`,
      { ...metadata, configKey }
    );
  }

  static invalidConfig(configKey: string, reason: string, metadata?: ErrorMetadata): ConfigurationError {
    return new ConfigurationError(
      `Invalid configuration for '${configKey}': ${reason}`,
      { ...metadata, configKey, reason }
    );
  }

  // Convert unknown errors to AppError
  static fromUnknown(error: unknown, defaultMessage: string = 'An unknown error occurred'): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError(
        error.message || defaultMessage,
        ErrorCode.UNKNOWN_ERROR,
        500,
        false,
        { originalError: error.name, stack: error.stack }
      );
    }

    return new AppError(
      defaultMessage,
      ErrorCode.UNKNOWN_ERROR,
      500,
      false,
      { originalError: String(error) }
    );
  }

  // Wrap Prisma errors
  static fromPrismaError(error: unknown): AppError {
    type PrismaErrorLike = {
      code?: string;
      message?: string;
      meta?: {
        target?: unknown;
        cause?: unknown;
      };
    };

    const prismaError = error as PrismaErrorLike;

    // Prisma error codes: https://www.prisma.io/docs/reference/api-reference/error-reference
    if (prismaError.code === 'P2002') {
      // Unique constraint violation
      const target = Array.isArray(prismaError.meta?.target)
        ? String(prismaError.meta?.target[0] ?? 'field')
        : 'field';

      return this.duplicate('Record', target, 'existing value');
    }

    if (prismaError.code === 'P2025') {
      // Record not found
      const cause = prismaError.meta?.cause ? String(prismaError.meta.cause) : 'unknown';
      return new NotFoundError('Record', cause);
    }

    if (prismaError.code === 'P2003') {
      // Foreign key constraint violation
      return this.database('Foreign key constraint violation');
    }

    // Generic database error
    return this.database(prismaError.message || 'Database operation failed');
  }
}

export default ErrorFactory;
