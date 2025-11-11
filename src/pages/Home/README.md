# Home Page Module

## Purpose
Entry point for the dashboard experience: task board, activity feed, and quick actions for tasks, fighters, and skills.

## Structure
- `Home.tsx` – Route container composing task board, modals, and summary panels.
- `components/` – Page-scoped UI pieces such as board columns, filters, and summary cards.

## Data Flow
- Consumes hooks from `@/hooks/tasks` and `@/hooks/fighters` to assemble view-ready data.
- Keeps modal state and derived selections centralized to avoid prop drilling across modules.

## Patterns & Conventions
- Uses shared layout components (`PageHeader`, `SectionCard`) to keep visual language consistent.
- Modals leverage `Modal` + `ModalActions` for uniform footers.
- New UI elements should live under `components/` with co-located styles/hooks when specific to the Home page.
