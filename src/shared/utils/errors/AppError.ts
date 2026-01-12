// src/shared/utils/errors/AppError.ts
// Base class for all custom application errors
// Inherited by all domain-specific errors

export enum ErrorCode {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  DUPLICATE_ERROR = 'DUPLICATE_ERROR',
  
  // Business logic errors
  INVALID_STATE = 'INVALID_STATE',
  OPERATION_FAILED = 'OPERATION_FAILED',
  
  // External service errors
  API_ERROR = 'API_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  
  // File/Storage errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  STORAGE_ERROR = 'STORAGE_ERROR',
  
  // CSV/Parsing errors
  CSV_PARSE_ERROR = 'CSV_PARSE_ERROR',
  INVALID_CSV_FORMAT = 'INVALID_CSV_FORMAT',
  MISSING_REQUIRED_COLUMN = 'MISSING_REQUIRED_COLUMN',
  
  // Job/Pipeline errors
  JOB_NOT_FOUND = 'JOB_NOT_FOUND',
  JOB_ALREADY_STARTED = 'JOB_ALREADY_STARTED',
  JOB_ALREADY_COMPLETED = 'JOB_ALREADY_COMPLETED',
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  INVALID_STEP = 'INVALID_STEP',
  
  // AI/TTS errors
  TEXT_GENERATION_ERROR = 'TEXT_GENERATION_ERROR',
  AUDIO_GENERATION_ERROR = 'AUDIO_GENERATION_ERROR',
  CHUNK_ERROR = 'CHUNK_ERROR',
  MERGE_ERROR = 'MERGE_ERROR',
  
  // Configuration errors
  MISSING_CONFIG = 'MISSING_CONFIG',
  INVALID_CONFIG = 'INVALID_CONFIG',
}

export interface ErrorMetadata {
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly metadata?: ErrorMetadata;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true,
    metadata?: ErrorMetadata
  ) {
    super(message);
    
    // Set the prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.metadata = metadata;
    this.timestamp = new Date();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  // Helper method to check if error is retryable
  public isRetryable(): boolean {
    return [
      ErrorCode.RATE_LIMIT,
      ErrorCode.TIMEOUT,
      ErrorCode.SERVICE_UNAVAILABLE,
      ErrorCode.API_ERROR,
    ].includes(this.code);
  }

  // Convert error to JSON for logging/API responses
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      metadata: this.metadata,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }

  // Convert error to safe API response (without stack trace)
  public toAPIResponse(): Record<string, unknown> {
    return {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        metadata: this.metadata,
      },
    };
  }
}

// Specific error classes extending AppError

export class ValidationError extends AppError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, true, metadata);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string, metadata?: ErrorMetadata) {
    super(`${resource} with id '${id}' not found`, ErrorCode.NOT_FOUND, 404, true, {
      ...metadata,
      resource,
      id,
    });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, ErrorCode.DATABASE_ERROR, 500, true, metadata);
  }
}

export class APIError extends AppError {
  constructor(service: string, message: string, metadata?: ErrorMetadata) {
    super(`${service} API error: ${message}`, ErrorCode.API_ERROR, 500, true, {
      ...metadata,
      service,
    });
  }
}

export class RateLimitError extends AppError {
  constructor(service: string, retryAfter?: number, metadata?: ErrorMetadata) {
    super(
      `Rate limit exceeded for ${service}${retryAfter ? `. Retry after ${retryAfter}s` : ''}`,
      ErrorCode.RATE_LIMIT,
      429,
      true,
      {
        ...metadata,
        service,
        retryAfter,
      }
    );
  }
}

export class FileError extends AppError {
  constructor(message: string, code: ErrorCode, metadata?: ErrorMetadata) {
    super(message, code, 400, true, metadata);
  }
}

export class CSVError extends AppError {
  constructor(message: string, code: ErrorCode, metadata?: ErrorMetadata) {
    super(message, code, 400, true, metadata);
  }
}

export class JobError extends AppError {
  constructor(message: string, code: ErrorCode, metadata?: ErrorMetadata) {
    super(message, code, 400, true, metadata);
  }
}

export class PipelineError extends AppError {
  constructor(message: string, step: string, metadata?: ErrorMetadata) {
    super(`Pipeline error at ${step}: ${message}`, ErrorCode.OPERATION_FAILED, 500, true, {
      ...metadata,
      step,
    });
  }
}

export class TextGenerationError extends AppError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, ErrorCode.TEXT_GENERATION_ERROR, 500, true, metadata);
  }
}

export class AudioGenerationError extends AppError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, ErrorCode.AUDIO_GENERATION_ERROR, 500, true, metadata);
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, ErrorCode.INVALID_CONFIG, 500, false, metadata);
  }
}
