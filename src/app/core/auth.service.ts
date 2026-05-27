import { Injectable, computed, signal } from '@angular/core';

export interface User {
  email: string;
  name: string;
  role: 'admin' | 'member';
}

interface DemoAccount extends User {
  password: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'admin@demo.com', password: 'demo123', name: 'Ana Souza', role: 'admin' },
  { email: 'membro@demo.com', password: 'demo123', name: 'Bruno Lima', role: 'member' },
];

const KEY = 'kanban.session';

/** Autenticação simulada (somente demo, sem backend). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(this.restore());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'admin');

  login(email: string, password: string): boolean {
    const acc = DEMO_ACCOUNTS.find(
      (a) => a.email === email.trim().toLowerCase() && a.password === password,
    );
    if (!acc) return false;
    const user: User = { email: acc.email, name: acc.name, role: acc.role };
    this._user.set(user);
    try {
      localStorage.setItem(KEY, JSON.stringify(user));
    } catch {
      /* ignore */
    }
    return true;
  }

  logout(): void {
    this._user.set(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }

  private restore(): User | null {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
