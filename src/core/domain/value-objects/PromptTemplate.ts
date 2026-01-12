// src/core/domain/value-objects/PromptTemplate.ts
// Template with variables {{var}}
// Method render(variables)
// Imported by GenerateTextUseCase

import { ValidationError } from '@/shared/utils/errors/AppError';

export interface PromptVariables {
  [key: string]: string | number | boolean | undefined;
}

export class PromptTemplate {
  private readonly variablePattern = /\{\{(\w+)\}\}/g;

  private constructor(
    public readonly template: string,
    public readonly requiredVariables: string[]
  ) {}

  static create(template: string): PromptTemplate {
    if (!template || template.trim().length === 0) {
      throw new ValidationError('Prompt template cannot be empty');
    }

    const requiredVariables = this.extractVariables(template);
    
    return new PromptTemplate(template, requiredVariables);
  }

  private static extractVariables(template: string): string[] {
    const pattern = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = pattern.exec(template)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  public render(variables: PromptVariables): string {
    this.validateVariables(variables);

    let rendered = this.template;

    for (const key in variables) {
      const value = variables[key];
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(placeholder, String(value ?? ''));
    }

    const remainingVariables = rendered.match(this.variablePattern);
    if (remainingVariables && remainingVariables.length > 0) {
      throw new ValidationError(
        `Template contains unresolved variables: ${remainingVariables.join(', ')}`
      );
    }

    return rendered;
  }

  private validateVariables(variables: PromptVariables): void {
    const missingVariables = this.requiredVariables.filter(
      (varName) => !(varName in variables)
    );

    if (missingVariables.length > 0) {
      throw new ValidationError(
        `Missing required variables: ${missingVariables.join(', ')}`
      );
    }
  }

  public hasVariable(variableName: string): boolean {
    return this.requiredVariables.includes(variableName);
  }

  public getRequiredVariables(): string[] {
    return [...this.requiredVariables];
  }

  public toJSON() {
    return {
      template: this.template,
      requiredVariables: this.requiredVariables,
    };
  }

  static example(): PromptTemplate {
    return PromptTemplate.create(
      'Generate a {{category}} script for: {{titre}}. Details: {{details}}'
    );
  }
}
