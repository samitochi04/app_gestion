import { Component, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../icon/icon';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

/** Debounced search box used atop every data-table (Filtre + free text). */
@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [FormsModule, Icon],
  template: `
    <div class="search">
      <app-icon name="search" [size]="16" />
      <input
        type="text"
        class="search__input"
        placeholder="Rechercher..."
        [(ngModel)]="term"
        (ngModelChange)="onInput($event)"
      />
    </div>
  `,
  styleUrl: './search-input.css',
})
export class SearchInput {
  term = '';
  changed = output<string>();
  private readonly input$ = new Subject<string>();

  constructor() {
    this.input$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((v) => this.changed.emit(v));
  }

  onInput(v: string): void {
    this.input$.next(v);
  }
}
