# Kanban Manager

Quadro kanban para gerenciar tarefas de uma sprint, feito com Angular 22, signals e Angular CDK Drag & Drop. Funciona 100% no navegador: os dados ficam no `localStorage`.

## Funcionalidades

- Arrastar e soltar cards entre colunas e reordenar dentro da coluna (CDK); colunas também podem ser reordenadas pelo cabeçalho.
- Criar, editar e excluir cards (título, descrição, prioridade, responsável, prazo e labels) em modal de detalhe.
- Criar, renomear, recolorir, definir limite WIP e excluir colunas (exclusão apenas para administradores).
- Busca por texto e filtros por prioridade, responsável e label.
- Desfazer (botão, aviso na tela ou `Ctrl+Z`) com histórico das últimas 30 ações.
- Persistência automática no `localStorage`, com tratamento de dados corrompidos e opção de restaurar o exemplo.
- Estados de carregamento (skeleton), vazio e erro.
- Tema claro/escuro (respeita `prefers-color-scheme`) e layout responsivo.
- Login simulado com guards de rota.

## Credenciais de demonstração

A tela de login já vem preenchida e tem botões "Entrar como ...":

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | `admin@demo.com` | `demo123` |
| Membro | `membro@demo.com` | `demo123` |

## Stack

Angular 22 (standalone, signals, `OnPush`, novo control flow), Angular CDK, Reactive Forms, TypeScript estrito, SCSS, Vitest.

## Como rodar

```bash
npm install --legacy-peer-deps   # (ou apenas npm install)
npm start                        # http://localhost:4200
npm run build
npm test
```

## Decisões de arquitetura

```
src/app/
├── core/
│   ├── board.store.ts   # estado do board (signals), undo, filtros e persistência
│   ├── auth.service.ts  # login simulado + contas demo
│   ├── auth.guard.ts    # authGuard / guestGuard
│   ├── theme.service.ts # tema claro/escuro
│   ├── models.ts, seed.ts
├── login/               # tela de login (lazy)
└── board/               # board-page, column, card, card-dialog (lazy)
```

- **Store com signals, sem biblioteca extra:** `BoardStore` expõe `columns` e `filters` como signals e derivações com `computed` (`visibleColumns`, `canUndo`...). Toda mutação passa por `commit()`, que guarda um snapshot imutável para o undo e dispara o `effect` que persiste no `localStorage`.
- **Movimentação independente de filtros:** o card é movido "antes do card X" (ou ao final), então o drag-and-drop continua correto mesmo com filtros ativos.
- **Rotas lazy** e componentes `OnPush` com `input()`/`output()`.
- **Dados simulados:** sem backend; trocar o `BoardStore` por chamadas HTTP é a evolução natural.
