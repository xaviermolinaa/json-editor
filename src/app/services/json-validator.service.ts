import { Injectable, signal } from '@angular/core';

export interface JsonError {
  message: string;
  line?: number;
  column?: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: JsonError;
  parsedJson?: unknown;
}

export interface JsonLimitations {
  maxCharacters: number;
  maxDepth: number | null;
  allowComments: boolean;
  allowTrailingCommas: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class JsonValidatorService {
  readonly defaultLimitations: JsonLimitations = {
    maxCharacters: 20000,
    maxDepth: null, // TODO: implement depth checking
    allowComments: false,
    allowTrailingCommas: false,
  };

  readonly limitations = signal<JsonLimitations>({ ...this.defaultLimitations });

  validate(jsonString: string): ValidationResult {
    // Check character limit
    const limits = this.limitations();
    if (jsonString.length > limits.maxCharacters) {
      return {
        isValid: false,
        error: {
          message: `JSON exceeds maximum character limit of ${limits.maxCharacters}`,
        },
      };
    }

    // Check for comments (JSONC)
    if (!limits.allowComments && this.hasComments(jsonString)) {
      return {
        isValid: false,
        error: {
          message: 'Comments are not allowed in strict JSON mode',
        },
      };
    }

    // Check for trailing commas
    if (!limits.allowTrailingCommas && this.hasTrailingCommas(jsonString)) {
      return {
        isValid: false,
        error: {
          message: 'Trailing commas are not allowed in strict JSON mode',
        },
      };
    }

    // Try to parse JSON
    try {
      const parsed = JSON.parse(jsonString);
      
      // Check depth if limit is set
      if (limits.maxDepth !== null) {
        const depth = this.calculateDepth(parsed);
        if (depth > limits.maxDepth) {
          return {
            isValid: false,
            error: {
              message: `JSON depth (${depth}) exceeds maximum depth of ${limits.maxDepth}`,
            },
          };
        }
      }

      return {
        isValid: true,
        parsedJson: parsed,
      };
    } catch (error) {
      return {
        isValid: false,
        error: this.parseJsonError(error, jsonString),
      };
    }
  }

  private parseJsonError(error: unknown, jsonString: string): JsonError {
    if (!(error instanceof Error)) {
      return { message: 'Unknown JSON parsing error' };
    }

    const message = error.message;
    
    // Try to extract line/column from error message
    // Common formats:
    // "Unexpected token } in JSON at position 123"
    // "JSON.parse: unexpected character at line 5 column 12"
    
    const positionMatch = message.match(/at position (\d+)/);
    if (positionMatch) {
      const position = parseInt(positionMatch[1], 10);
      const { line, column } = this.getLineAndColumn(jsonString, position);
      return { message, line, column };
    }

    const lineColMatch = message.match(/line (\d+) column (\d+)/);
    if (lineColMatch) {
      return {
        message,
        line: parseInt(lineColMatch[1], 10),
        column: parseInt(lineColMatch[2], 10),
      };
    }

    return { message };
  }

  private getLineAndColumn(text: string, position: number): { line: number; column: number } {
    const lines = text.substring(0, position).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
    };
  }

  private hasComments(jsonString: string): boolean {
    // Simple check for // or /* */ patterns
    // Note: This is a basic check and might have false positives in string values
    const commentPatterns = [/\/\/.*/, /\/\*[\s\S]*?\*\//];
    return commentPatterns.some(pattern => pattern.test(jsonString));
  }

  private hasTrailingCommas(jsonString: string): boolean {
    // Check for commas before closing brackets/braces
    // This is a simple regex check
    return /,\s*[}\]]/g.test(jsonString);
  }

  private calculateDepth(obj: unknown, currentDepth = 0): number {
    if (obj === null || typeof obj !== 'object') {
      return currentDepth;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return currentDepth + 1;
      return Math.max(...obj.map(item => this.calculateDepth(item, currentDepth + 1)));
    }

    const values = Object.values(obj);
    if (values.length === 0) return currentDepth + 1;
    return Math.max(...values.map(value => this.calculateDepth(value, currentDepth + 1)));
  }

  formatJson(jsonString: string): string | null {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return null;
    }
  }
}
