// src/core/ports/services/validation/ISchemaValidatorService.ts
// Generic schema validation port (keeps core independent from a specific validation library)

export interface SafeParseSuccess<T> {
  success: true;
  data: T;
}

export interface SafeParseFailure {
  success: false;
  error: unknown;
}

export type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseFailure;

export interface ParserSchema<T> {
  parse: (data: unknown) => T;
  safeParse?: (data: unknown) => SafeParseResult<T>;
}

export interface ISchemaValidatorService {
  parse<T>(schema: ParserSchema<T>, data: unknown): T;
  safeParse<T>(schema: ParserSchema<T>, data: unknown): SafeParseResult<T>;
}
