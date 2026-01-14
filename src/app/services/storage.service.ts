import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'json-editor-content';
const LAST_SAVED_KEY = 'json-editor-last-saved';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  readonly lastSaved = signal<Date | null>(this.getLastSaved());

  save(content: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, content);
      const now = new Date();
      localStorage.setItem(LAST_SAVED_KEY, now.toISOString());
      this.lastSaved.set(now);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      throw new Error('Failed to save content');
    }
  }

  load(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }

  private getLastSaved(): Date | null {
    try {
      const saved = localStorage.getItem(LAST_SAVED_KEY);
      return saved ? new Date(saved) : null;
    } catch {
      return null;
    }
  }
}
