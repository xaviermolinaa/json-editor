import { Component } from '@angular/core';
import { JsonEditorComponent } from './components/json-editor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [JsonEditorComponent],
  template: '<app-json-editor></app-json-editor>',
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `]
})
export class App {}
