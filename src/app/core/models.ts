export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Member {
  id: string;
  name: string;
  color: string;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  labels: string[];
  assigneeId: string | null;
  /** ISO date (yyyy-mm-dd) */
  dueDate: string | null;
  createdAt: string;
}

export interface Column {
  id: string;
  title: string;
  color: string;
  /** WIP limit (optional) */
  limit: number | null;
  cards: Card[];
}

export interface Filters {
  query: string;
  priority: Priority | '';
  assigneeId: string;
  label: string;
}

export const EMPTY_FILTERS: Filters = { query: '', priority: '', assigneeId: '', label: '' };

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

export const LABELS: { name: string; color: string }[] = [
  { name: 'frontend', color: '#6366f1' },
  { name: 'backend', color: '#0ea5e9' },
  { name: 'design', color: '#ec4899' },
  { name: 'bug', color: '#ef4444' },
  { name: 'infra', color: '#14b8a6' },
  { name: 'docs', color: '#f59e0b' },
];

export const COLUMN_COLORS = ['#6366f1', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#0ea5e9'];

export function labelColor(name: string): string {
  return LABELS.find((l) => l.name === name)?.color ?? '#64748b';
}
