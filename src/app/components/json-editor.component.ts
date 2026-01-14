import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  signal,
  effect,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MonacoEditorModule } from 'ngx-monaco-editor-v2';

declare const monaco: any;

import { JsonValidatorService, ValidationResult } from '../services/json-validator.service';
import { SampleDataService, JsonSample } from '../services/sample-data.service';
import { StorageService } from '../services/storage.service';

interface Theme {
  name: string;
  value: string;
}

@Component({
  selector: 'app-json-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatInputModule,
    MatExpansionModule,
    MatCardModule,
    MatTooltipModule,
    MonacoEditorModule,
  ],
  templateUrl: './json-editor.component.html',
  styleUrls: ['./json-editor.component.css'],
})
export class JsonEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editor', { static: false }) editorElement!: ElementRef;

  private editorInstance: any = null;
  private errorDecorations: string[] = [];

  readonly content = signal<string>('');
  readonly validationResult = signal<ValidationResult>({ isValid: true });
  readonly selectedTheme = signal<string>('vs');
  readonly wrapEnabled = signal<boolean>(false);
  readonly selectedSample = signal<number>(-1);

  // Monaco Editor options
  readonly editorOptions = signal<any>({
    theme: 'vs',
    language: 'json',
    automaticLayout: true,
    formatOnPaste: true,
    formatOnType: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'off',
    tabSize: 2,
    insertSpaces: true,
    'semanticHighlighting.enabled': true,
    glyphMargin: true,
  });

  // Limitations
  readonly maxCharacters = signal<number>(20000);
  readonly maxDepth = signal<number | null>(null);
  readonly allowComments = signal<boolean>(false);
  readonly allowTrailingCommas = signal<boolean>(false);

  readonly themes: Theme[] = [
    { name: 'VS Dark', value: 'vs-dark' },
    { name: 'VS Light', value: 'vs' },
    { name: 'High Contrast Dark', value: 'hc-black' },
    { name: 'High Contrast Light', value: 'hc-light' },
  ];

  readonly samples: JsonSample[];
  readonly canSave = computed(() => {
    const result = this.validationResult();
    return result.isValid && this.content().length > 0;
  });

  readonly lastSaved = computed(() => this.storageService.lastSaved());

  readonly characterCount = computed(() => this.content().length);
  readonly characterLimit = computed(() => this.maxCharacters());

  readonly isOverLimit = computed(() => this.characterCount() > this.characterLimit());

  readonly errorMessage = computed(() => {
    const result = this.validationResult();
    if (!result.error) return null;

    let msg = result.error.message;
    if (result.error.line !== undefined && result.error.column !== undefined) {
      msg += ` (Line ${result.error.line}, Column ${result.error.column})`;
    }
    return msg;
  });

  constructor(
    private validatorService: JsonValidatorService,
    private sampleService: SampleDataService,
    private storageService: StorageService,
    private snackBar: MatSnackBar
  ) {
    this.samples = this.sampleService.samples;

    // Update validator limitations when they change
    effect(() => {
      this.validatorService.limitations.set({
        maxCharacters: this.maxCharacters(),
        maxDepth: this.maxDepth(),
        allowComments: this.allowComments(),
        allowTrailingCommas: this.allowTrailingCommas(),
      });
      this.validateContent();
    });

    // Load saved content on init
    const saved = this.storageService.load();
    if (saved) {
      this.content.set(saved);
    } else {
      // Default to first sample
      this.content.set(this.samples[0].content);
    }
  }

  ngAfterViewInit(): void {
    // Monaco editor initialization happens automatically via template
    this.validateContent();
  }

  ngOnDestroy(): void {
    // Monaco editor cleanup happens automatically
  }

  onEditorInit(editor: any): void {
    this.editorInstance = editor;

    const model = editor.getModel();
    if (!model) return;

    // Listen for validation updates from Monaco
    monaco.editor.onDidChangeMarkers(() => {
      this.updateErrorDecorations(model);
    });

    // Initial run
    this.updateErrorDecorations(model);
  }

  onContentChange(value: string): void {
    this.content.set(value);
    this.validateContent();
  }

  private validateContent(): void {
    const result = this.validatorService.validate(this.content());
    this.validationResult.set(result);
  }

  onThemeChange(theme: string): void {
    this.selectedTheme.set(theme);
    this.editorOptions.update(opts => ({ ...opts, theme }));
  }

  onWrapToggle(enabled: boolean): void {
    this.wrapEnabled.set(enabled);
    this.editorOptions.update(opts => ({ ...opts, wordWrap: enabled ? 'on' : 'off' }));
  }

  onSampleChange(index: number): void {
    if (index >= 0 && index < this.samples.length) {
      const sample = this.samples[index];
      this.content.set(sample.content);
      this.validateContent();
    }
  }

  formatJson(): void {
    const formatted = this.validatorService.formatJson(this.content());
    if (formatted) {
      this.content.set(formatted);
      this.validateContent();
      this.snackBar.open('JSON formatted successfully', 'Close', { duration: 2000 });
    } else {
      this.snackBar.open('Cannot format invalid JSON', 'Close', { duration: 3000 });
    }
  }

  save(): void {
    if (!this.canSave()) {
      return;
    }

    try {
      this.storageService.save(this.content());
      this.snackBar.open('JSON saved successfully!', 'Close', { duration: 2000 });
    } catch (error) {
      this.snackBar.open('Failed to save JSON', 'Close', { duration: 3000 });
    }
  }

  onMaxCharactersChange(value: string): void {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      this.maxCharacters.set(num);
    }
  }

  onMaxDepthChange(value: string): void {
    const num = parseInt(value, 10);
    if (value === '' || value === null) {
      this.maxDepth.set(null);
    } else if (!isNaN(num) && num > 0) {
      this.maxDepth.set(num);
    }
  }

  private updateErrorDecorations(model: any): void {
    if (!this.editorInstance || typeof monaco === 'undefined') {
      return;
    }

    // Get all markers (errors/warnings) from Monaco's JSON validator
    const markers = monaco.editor
      .getModelMarkers({ resource: model.uri })
      .filter((m: any) => m.severity === monaco.MarkerSeverity.Error);

    // Create decorations for each error line
    const newDecorations = markers.map((marker: any) => ({
      range: new monaco.Range(
        marker.startLineNumber,
        1,
        marker.endLineNumber,
        1
      ),
      options: {
        isWholeLine: true,
        className: 'json-error-line',
        glyphMarginClassName: 'error-glyph',
        linesDecorationsClassName: 'error-line-decoration'
      }
    }));

    // Update decorations
    this.errorDecorations = this.editorInstance.deltaDecorations(
      this.errorDecorations,
      newDecorations
    );
  }
}
