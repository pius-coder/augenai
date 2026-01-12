// src/infrastructure/services/parsing/csv/PapaParseService.ts
// PapaParse CSV parser service implementation

/* eslint-disable @typescript-eslint/no-explicit-any */
import Papa from 'papaparse';
import { ICSVParserService, CSVParserOptions } from '@/core/ports/services/parsing/ICSVParserService';
import { CSVRow, ContentCategory } from '@/core/domain/value-objects/CSVRow';
import { ValidationError, CSVError } from '@/shared/utils/errors/AppError';

export class PapaParseService implements ICSVParserService {
  async parse(input: CSVInput, options?: CSVParserOptions): Promise<CSVRow[]> {
    return new Promise((resolve, reject) => {
      const config = {
        delimiter: options?.delimiter || ',',
        header: options?.hasHeader !== false, // default true
        skipEmptyLines: options?.skipEmptyLines !== false, // default true
        transformHeader: (header: string) => header.trim().toLowerCase(),
        complete: (results: Papa.ParseResult<any>) => {
          try {
            if (results.errors && results.errors.length > 0) {
              const fatalError = results.errors.find((e: any) => e.type === 'Delimiter');
              if (fatalError) {
                throw new CSVError(fatalError.message, 'INVALID_CSV_FORMAT');
              }
            }

            const csvRows = this.mapToCSVRows(results.data, options);
            resolve(csvRows);
          } catch (error) {
            if (error instanceof CSVError) {
              reject(error);
            } else {
              reject(new CSVError(`Failed to parse CSV: ${error}`, 'CSV_PARSE_ERROR'));
            }
          }
        },
        error: (error: Error) => {
          reject(new CSVError(error.message, 'CSV_PARSE_ERROR'));
        },
      };

      if (typeof input === 'string') {
        Papa.parse(input, config);
      } else if (input instanceof Buffer) {
        const text = input.toString('utf-8');
        Papa.parse(text, config);
      } else if (input instanceof ArrayBuffer) {
        const text = Buffer.from(input).toString('utf-8');
        Papa.parse(text, config);
      } else if (typeof Blob !== 'undefined' && input instanceof Blob) {
        input.text().then(text => Papa.parse(text, config));
      } else {
        reject(new ValidationError('Unsupported input type for CSV parsing'));
      }
    });
  }

  private mapToCSVRows(data: any[], options?: CSVParserOptions): CSVRow[] {
    const rows: CSVRow[] = [];
    const maxRows = options?.maxRows || Infinity;

    for (let i = 0; i < data.length && i < maxRows; i++) {
      const row = data[i];

      if (!row || typeof row !== 'object') {
        continue;
      }

      try {
        const csvRow = this.createCSVRow(row);
        rows.push(csvRow);
      } catch (error) {
        // Skip invalid rows but continue processing others
        console.warn(`Skipping invalid row ${i + 1}:`, error);
      }
    }

    return rows;
  }

  private createCSVRow(data: any): CSVRow {
    const titre = this.extractField(data, ['titre', 'title', 'name', 'nom']);
    const details = this.extractField(data, ['details', 'description', 'desc', 'content', 'contenu']);
    const categoryStr = this.extractField(data, ['category', 'type', 'catégorie', 'cat']);
    const reference = this.extractField(data, ['reference', 'ref', 'keywords', 'mots-clés']);

    if (!titre) {
      throw new ValidationError('Titre field is required');
    }

    if (!details) {
      throw new ValidationError('Details field is required');
    }

    const category = this.parseCategory(categoryStr);

    return {
      titre: titre.trim(),
      details: details.trim(),
      category,
      reference: reference?.trim(),
    };
  }

  private extractField(data: any, possibleKeys: string[]): string | undefined {
    for (const key of possibleKeys) {
      if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
        return String(data[key]);
      }
    }
    return undefined;
  }

  private parseCategory(value: string | undefined): ContentCategory {
    if (!value) {
      return ContentCategory.CORPS; // Default to CORPS
    }

    const normalized = value.trim().toLowerCase();

    // Map common variations to enum values
    const categoryMap: Record<string, ContentCategory> = {
      'ouverture': ContentCategory.OUVERTURE,
      'opening': ContentCategory.OUVERTURE,
      'intro': ContentCategory.OUVERTURE,
      'introduction': ContentCategory.OUVERTURE,
      'corps': ContentCategory.CORPS,
      'body': ContentCategory.CORPS,
      'main': ContentCategory.CORPS,
      'fermeture': ContentCategory.FERMETURE,
      'closing': ContentCategory.FERMETURE,
      'conclusion': ContentCategory.FERMETURE,
      'end': ContentCategory.FERMETURE,
      'outro': ContentCategory.FERMETURE,
    };

    return categoryMap[normalized] || ContentCategory.CORPS;
  }
}

// Type alias for input types
type CSVInput = string | Buffer | ArrayBuffer | Blob;
/* eslint-enable @typescript-eslint/no-explicit-any */
