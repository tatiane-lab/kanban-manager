import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, DEMO_ACCOUNTS } from '../core/auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <main class="login">
      <section class="login__card">
        <div class="brand brand--center">
          <span class="brand__logo" aria-hidden="true">&#9638;</span>
          <h1>Kanban Manager</h1>
        </div>
        <p class="login__sub">Entre para acessar o board da sprint.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <label class="field">E-mail
            <input type="email" formControlName="email" autocomplete="username" />
          </label>
          <label class="field">Senha
            <input type="password" formControlName="password" autocomplete="current-password" />
          </label>
          @if (error()) {
            <p class="field__error" role="alert">{{ error() }}</p>
          }
          <button class="btn btn--primary btn--block" type="submit">Entrar</button>
        </form>

        <div class="demo">
          <p class="demo__title">Credenciais de demonstração</p>
          @for (a of accounts; track a.email) {
            <button type="button" class="demo__btn" (click)="enterAs(a.email, a.password)">
              <span><strong>Entrar como {{ a.role === 'admin' ? 'Administrador' : 'Membro' }}</strong>
                <small>{{ a.email }} &middot; {{ a.password }}</small></span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          }
          <small class="demo__note">Administradores podem excluir colunas. Dados ficam apenas no seu navegador.</small>
        </div>
      </section>
    </main>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly accounts = DEMO_ACCOUNTS;
  protected readonly error = signal('');

  // pré-preenchido com a conta demo de administrador
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: [DEMO_ACCOUNTS[0].email, [Validators.required, Validators.email]],
    password: [DEMO_ACCOUNTS[0].password, Validators.required],
  });

  protected submit(): void {
    const { email, password } = this.form.getRawValue();
    this.attempt(email, password);
  }

  protected enterAs(email: string, password: string): void {
    this.form.setValue({ email, password });
    this.attempt(email, password);
  }

  private attempt(email: string, password: string): void {
    if (this.auth.login(email, password)) {
      void this.router.navigateByUrl('/board');
    } else {
      this.error.set('E-mail ou senha inválidos.');
    }
  }
}
