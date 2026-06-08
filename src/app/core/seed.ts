import { Card, Column, Member } from './models';

export const MEMBERS: Member[] = [
  { id: 'm1', name: 'Ana Souza', color: '#6366f1' },
  { id: 'm2', name: 'Bruno Lima', color: '#0ea5e9' },
  { id: 'm3', name: 'Carla Mendes', color: '#ec4899' },
  { id: 'm4', name: 'Diego Rocha', color: '#10b981' },
];

export function isoDay(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function seedColumns(): Column[] {
  const now = new Date().toISOString();
  const c = (
    id: string,
    title: string,
    priority: Card['priority'],
    labels: string[],
    assigneeId: string | null,
    dueDate: string | null,
    description = '',
  ): Card => ({ id, title, description, priority, labels, assigneeId, dueDate, createdAt: now });

  return [
    {
      id: 'backlog', title: 'Backlog', color: '#6366f1', limit: null,
      cards: [
        c('c1', 'Pesquisar bibliotecas de gráficos para o dashboard', 'low', ['frontend', 'docs'], 'm3', isoDay(14),
          'Comparar ngx-charts, Chart.js e ECharts em tamanho de bundle e acessibilidade.'),
        c('c2', 'Definir contrato da API de notificações', 'medium', ['backend', 'docs'], 'm2', isoDay(9)),
        c('c3', 'Exportar relatório mensal em CSV', 'low', ['backend'], null, null),
      ],
    },
    {
      id: 'todo', title: 'A fazer', color: '#0ea5e9', limit: 5,
      cards: [
        c('c4', 'Corrigir overflow do menu no mobile', 'high', ['frontend', 'bug'], 'm1', isoDay(2),
          'O menu lateral estoura a viewport em telas abaixo de 360px.'),
        c('c5', 'Criar tela de configurações do perfil', 'medium', ['frontend', 'design'], 'm3', isoDay(6)),
        c('c6', 'Configurar pipeline de deploy em staging', 'urgent', ['infra'], 'm4', isoDay(-1),
          'Bloqueia a validação do QA. Usar GitHub Actions com cache de dependências.'),
      ],
    },
    {
      id: 'doing', title: 'Em andamento', color: '#f59e0b', limit: 3,
      cards: [
        c('c7', 'Implementar autenticação com refresh token', 'urgent', ['backend'], 'm2', isoDay(1),
          'Rotação de refresh token e logout em todos os dispositivos.'),
        c('c8', 'Refatorar formulário de checkout com signals', 'high', ['frontend'], 'm1', isoDay(4)),
      ],
    },
    {
      id: 'review', title: 'Em revisão', color: '#8b5cf6', limit: null,
      cards: [c('c9', 'Adicionar testes e2e do fluxo de login', 'medium', ['frontend', 'infra'], 'm4', isoDay(3))],
    },
    {
      id: 'done', title: 'Concluído', color: '#10b981', limit: null,
      cards: [
        c('c10', 'Migrar projeto para Angular 22', 'high', ['frontend'], 'm1', isoDay(-5)),
        c('c11', 'Documentar guia de contribuição', 'low', ['docs'], 'm3', isoDay(-3)),
      ],
    },
  ];
}
