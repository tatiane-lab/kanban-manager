import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Card, LABELS, Member, PRIORITIES, Priority } from '../core/models';
import { CardDraft } from '../core/board.store';

@Component({
  selector: 'app-card-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  host: { '(document:keydown.escape)': 'close.emit()' },
  template: `
    <div class="backdrop" (mousedown)="onBackdrop($event)">
      <form class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title" [formGroup]="form" (ngSubmit)="submit()">
        <header class="dialog__header">
          <h2 id="dlg-title">Detalhes do card</h2>
          <button type="button" class="icon-btn" (click)="close.emit()" aria-label="Fechar">&times;</button>
        </header>

        <label class="field">Título
          <input #title formControlName="title" maxlength="120" placeholder="O que precisa ser feito?" />
          @if (form.controls.title.touched && form.controls.title.invalid) {
            <small class="field__error">Informe um título.</small>
          }
        </label>

        <label class="field">Descrição
          <textarea formControlName="description" rows="4" placeholder="Contexto, critérios de aceite..."></textarea>
        </label>

        <div class="grid">
          <label class="field">Prioridade
            <select formControlName="priority">
              @for (p of priorities; track p.value) {
                <option [value]="p.value">{{ p.label }}</option>
              }
            </select>
          </label>
          <label class="field">Responsável
            <select formControlName="assigneeId">
              <option value="">Sem responsável</option>
              @for (m of members(); track m.id) {
                <option [value]="m.id">{{ m.name }}</option>
              }
            </select>
          </label>
          <label class="field">Prazo
            <input type="date" formControlName="dueDate" />
          </label>
        </div>

        <fieldset class="field">
          <legend>Labels</legend>
          <div class="chips">
            @for (l of labels; track l.name) {
              <button type="button" class="chip chip--toggle" [class.chip--on]="selected().includes(l.name)"
                [style.--chip]="l.color" [attr.aria-pressed]="selected().includes(l.name)" (click)="toggle(l.name)">
                {{ l.name }}
              </button>
            }
          </div>
        </fieldset>

        <footer class="dialog__footer">
          <button type="button" class="btn btn--danger" (click)="remove.emit()">Excluir</button>
          <span class="spacer"></span>
          <button type="button" class="btn btn--ghost" (click)="close.emit()">Cancelar</button>
          <button type="submit" class="btn btn--primary">Salvar</button>
        </footer>
      </form>
    </div>
  `,
})
export class CardDialogComponent {
  readonly card = input.required<Card>();
  readonly members = input<Member[]>([]);
  readonly save = output<Partial<CardDraft>>();
  readonly remove = output<void>();
  readonly close = output<void>();

  protected readonly priorities = PRIORITIES;
  protected readonly labels = LABELS;
  protected readonly selected = signal<string[]>([]);
  private readonly fb = inject(FormBuilder);
  private readonly el = inject(ElementRef<HTMLElement>);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.pattern(/\S/)]],
    description: [''],
    priority: ['medium' as Priority],
    assigneeId: [''],
    dueDate: [''],
  });

  constructor() {
    afterNextRender(() => {
      const c = this.card();
      this.form.reset({
        title: c.title,
        description: c.description,
        priority: c.priority,
        assigneeId: c.assigneeId ?? '',
        dueDate: c.dueDate ?? '',
      });
      this.selected.set([...c.labels]);
      (this.el.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input')?.focus();
    });
  }

  protected toggle(name: string): void {
    this.selected.update((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));
  }

  protected onBackdrop(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('backdrop')) this.close.emit();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.save.emit({
      title: v.title.trim(),
      description: v.description.trim(),
      priority: v.priority,
      assigneeId: v.assigneeId || null,
      dueDate: v.dueDate || null,
      labels: this.selected(),
    });
  }
}
