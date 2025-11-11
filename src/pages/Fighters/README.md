# Fighters Page Module

## Purpose
Centralizes UI and state management for fighters: listing, profile view, creation, and skill progress summaries.

## Structure
- `Fighters.tsx` – Route entry point. Orchestrates data hooks, modal state, and passes props into page components.
- `components/` – Focused UI pieces that compose the page:
  - `FightersHeader` – Controls filtering, grouping, and quick actions.
  - `FighterCard` – Displays per-fighter stats and actions.
  - `CreateFighterModal` – Modal for adding a new fighter.
  - `FighterProfileModal` – Detail modal with skills, history, and navigation.

## Data Flow
- Consumes domain hooks (`useFighterState`, `useTaskState`) at the page level; child components receive derived props only.
- Modal visibility/state handled in `Fighters.tsx` to keep child components presentational.

## Patterns & Conventions
- All modals use shared `Modal` + `ModalActions` components.
- Components expect already-filtered collections; avoid re-querying inside cards/modals.
- Favor `SectionCard` or page-level layout wrappers when introducing new sections.
