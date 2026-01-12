// src/core/ports/services/parsing/ICSVParserService.ts
// CSV parsing port

import { CSVRow } from '../../../domain/value-objects/CSVRow';

export type CSVInput = string | Buffer | ArrayBuffer | Blob;

export interface CSVParserOptions {
  delimiter?: string;
  hasHeader?: boolean;
  skipEmptyLines?: boolean;
  maxRows?: number;
}

export interface ICSVParserService {
  parse(input: CSVInput, options?: CSVParserOptions): Promise<CSVRow[]>;
}
