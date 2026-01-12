// src/core/ports/services/validation/IValidationService.ts
// Domain-level validation port (business rules that may require external lookups)

import type { ContentItem } from '../../../domain/entities/ContentItem';
import type { Job } from '../../../domain/entities/Job';
import type { CSVRow } from '../../../domain/value-objects/CSVRow';
import type { VoiceSettings } from '../../../domain/value-objects/VoiceSettings';

export interface IValidationService {
  validateCSVRow(row: CSVRow): Promise<void>;
  validateJob(job: Job): Promise<void>;
  validateContentItem(item: ContentItem): Promise<void>;
  validateVoiceSettings(settings: VoiceSettings): Promise<void>;
}
