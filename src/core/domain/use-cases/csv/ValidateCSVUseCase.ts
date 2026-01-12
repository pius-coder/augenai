// src/core/domain/use-cases/csv/ValidateCSVUseCase.ts
// Use case: Validate CSV file structure

import { z } from 'zod';
import { ICSVValidationService } from '@/core/ports/services/validation/ICSVValidationService';
import ErrorFactory from '@/shared/utils/errors/ErrorFactory';

const ValidateCSVSchema = z.object({
  filePath: z.string().min(1, 'File path is required'),
});

export type ValidateCSVInput = z.infer<typeof ValidateCSVSchema>;

export interface ValidateCSVOutput {
  isValid: boolean;
  errors: string[];
  rowCount: number;
}

export class ValidateCSVUseCase {
  constructor(private readonly csvValidationService: ICSVValidationService) {}

  async execute(input: ValidateCSVInput): Promise<ValidateCSVOutput> {
    const { filePath } = ValidateCSVSchema.parse(input);

    const result = await this.csvValidationService.validateFile(filePath);

    return {
      isValid: result.isValid,
      errors: result.errors,
      rowCount: result.rowCount,
    };
  }
}
