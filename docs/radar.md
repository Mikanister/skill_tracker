# Frontend Architecture Radar

Snapshots of current conventions and areas under review.

## UI Conventions
- **Modals**: Use `Modal` + `ModalActions` with `start` slot for destructive actions. Button variants centralized in `ModalActions`.
- **Layout**: `PageHeader` for page mastheads, `SectionCard` for section blocks, `.stack` utility classes for spacing.
- **Buttons**: Use existing variant classes; add new variants through `ModalActions` mapping and `ui.css`.
- **Typography & Theme**: Base fonts and theme toggles controlled in `AppShell`. Respect `data-theme` attribute.

## State Management
- **Domain Hooks**:
  - `useSkillTreeState` – skill/catalog CRUD + profiles.
  - `useFighterState` – fighter roster, skills, and XP ledger.
  - `useTaskState` – task lifecycle, persistence, undo coordination.
  - `useTaskBoard` & `useMultiAssignForm` – derived UI state.
- **Undo**: `UndoManager` shared across hooks; ensure mutations push meaningful descriptions.

## Data & Persistence
- LocalStorage keys prefixed `skillrpg_*`. Access wrapped by `safeGetItem`/`safeSetItem`.
- Skill tree and fighters persisted per profile. Reset flows handled via `storage.ts` helpers.

## Testing & Quality Gates
- Vitest (`npm test -- --run`) for suites in `src/*.test.ts[x]`.
- Target smoke coverage for every modal and critical hook.
- Build (`npm run build`) ensures type safety.

## Documentation
- Page modules include README with structure/data flow.
- UI guidelines documented in `docs/ui-guidelines.md`.
- Testing templates in `docs/testing-templates.md`.

## Open Questions / Future Review
- Consider Storybook or alternative preview tooling for complex components.
- Evaluate breaking `AppShell` into sub-layout components for lighter imports.
- Assess need for context providers instead of passing state props through routes.
