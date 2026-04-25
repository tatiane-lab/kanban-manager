# Kanban Manager

> Angular 22 · NgRx SignalStore · Angular CDK Drag & Drop · Optimistic Updates · Vitest + Testing Library

A Trello-like Kanban board with real-time drag-and-drop, signal-driven state, and rollback on API failure.

## Features

- **NgRx SignalStore** – board state lives in `signalStore()` using `withState`, `withComputed`, and `withMethods`; each piece of state is a fine-grained signal automatically.
- **CDK Drag & Drop** – columns are `cdkDropList` containers; cards are `cdkDrag` items; `cdkDropListGroup` wires cross-column moves without manual wiring.
- **Optimistic Updates with Rollback** – `moveCard()` and `addCard()` snapshot the current state, mutate optimistically, make the HTTP call, and restore the snapshot on error — zero flicker on success, transparent rollback on failure.
- **Angular Control Flow** – all templates use `@for`, `@if`, `@empty` (Angular 17+ built-in control flow, no `*ngFor`/`*ngIf`).
- **Jest Unit Tests** – `KanbanStore` is tested with injected mocks via `TestBed`; rollback scenario verifies the snapshot restoration.

## Tech Stack

| Package | Version |
|---|---|
| `@angular/core` | ^22.3.0 |
| `@angular/cdk` | ^22.3.0 |
| `@ngrx/signals` | ^22.0.0 |
| `jest` / `@testing-library/angular` | ^29 / ^17 |

## Running locally

```bash
npm install
ng serve

# Tests
npm test
```

## Architecture

```
src/app/
├── store/
│   └── kanban.store.ts   # NgRx SignalStore — state, computed, methods
└── board/
    ├── board.component.ts     # CdkDropListGroup + orchestration
    ├── column.component.ts    # CdkDropList per column
    ├── card.component.ts      # CdkDrag per card
    ├── board.service.ts       # HTTP calls (move, add, delete)
    └── kanban.store.spec.ts   # Vitest unit tests
```
