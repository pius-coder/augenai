// src/core/domain/value-objects/CSVRow.ts
// Class for a CSV row with validation
// Imported by ContentItem entity

import { ValidationError } from '@/shared/utils/errors/AppError';

export enum ContentCategory {
  OUVERTURE = 'OUVERTURE',   // Introduction/Opening
  CORPS = 'CORPS',           // Main body
  FERMETURE = 'FERMETURE',   // Conclusion/Closing
}

export interface CSVRowData {
  titre: string;
  details: string;
  category: ContentCategory;
  reference?: string;
}

export class CSVRow {
  private constructor(
    public readonly titre: string,
    public readonly details: string,
    public readonly category: ContentCategory,
    public readonly reference?: string
  ) {}

  static create(data: CSVRowData): CSVRow {
    this.validate(data);
    return new CSVRow(
      data.titre.trim(),
      data.details.trim(),
      data.category,
      data.reference?.trim()
    );
  }

  static fromRawCSV(row: Record<string, string>, rowIndex: number): CSVRow {
    try {
      const titre = row['titre'] || row['Titre'] || row['title'];
      const details = row['details'] || row['Details'] || row['description'];
      const categoryRaw = row['category'] || row['Category'] || row['categorie'];
      const reference = row['reference'] || row['Reference'];

      if (!titre) {
        throw new ValidationError(`Row ${rowIndex}: Missing 'titre' column`);
      }

      if (!details) {
        throw new ValidationError(`Row ${rowIndex}: Missing 'details' column`);
      }

      if (!categoryRaw) {
        throw new ValidationError(`Row ${rowIndex}: Missing 'category' column`);
      }

      const category = this.parseCategory(categoryRaw, rowIndex);

      return this.create({ titre, details, category, reference });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(`Row ${rowIndex}: ${error instanceof Error ? error.message : 'Invalid data'}`);
    }
  }

  private static parseCategory(value: string, rowIndex: number): ContentCategory {
    const normalized = value.toUpperCase().trim();
    
    if (normalized === 'OUVERTURE' || normalized === 'OPENING' || normalized === 'INTRO') {
      return ContentCategory.OUVERTURE;
    }
    
    if (normalized === 'CORPS' || normalized === 'BODY' || normalized === 'MAIN') {
      return ContentCategory.CORPS;
    }
    
    if (normalized === 'FERMETURE' || normalized === 'CLOSING' || normalized === 'CONCLUSION') {
      return ContentCategory.FERMETURE;
    }

    throw new ValidationError(
      `Row ${rowIndex}: Invalid category '${value}'. Must be one of: OUVERTURE, CORPS, FERMETURE`
    );
  }

  private static validate(data: CSVRowData): void {
    if (!data.titre || data.titre.trim().length === 0) {
      throw new ValidationError('Titre is required and cannot be empty');
    }

    if (data.titre.length > 200) {
      throw new ValidationError('Titre cannot exceed 200 characters');
    }

    if (!data.details || data.details.trim().length === 0) {
      throw new ValidationError('Details are required and cannot be empty');
    }

    if (data.details.length > 5000) {
      throw new ValidationError('Details cannot exceed 5000 characters');
    }

    if (!Object.values(ContentCategory).includes(data.category)) {
      throw new ValidationError(`Invalid category: ${data.category}`);
    }

    if (data.reference && data.reference.length > 500) {
      throw new ValidationError('Reference cannot exceed 500 characters');
    }
  }

  public toJSON(): CSVRowData {
    return {
      titre: this.titre,
      details: this.details,
      category: this.category,
      reference: this.reference,
    };
  }

  public getCategoryLabel(): string {
    const labels: Record<ContentCategory, string> = {
      [ContentCategory.OUVERTURE]: 'Opening',
      [ContentCategory.CORPS]: 'Main Content',
      [ContentCategory.FERMETURE]: 'Closing',
    };
    return labels[this.category];
  }
}
