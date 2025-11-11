# Settings Page Module

## Purpose
Provides administrative controls for resetting state, exporting/importing data, and managing application-level preferences.

## Structure
- `Settings.tsx` – Route entry responsible for orchestrating confirmation flows and rendering the primary panels.
- `components/` – Includes modular panels for reset flows, data management, and profile management.

## Data Flow
- Page coordinates undo/reset hooks and surfaces callbacks to child components.
- Child components remain presentational, receiving event handlers and status flags via props.

## Patterns & Conventions
- Use shared primitives (`SectionCard`, `PageHeader`, button variants) to maintain consistent visuals.
- Keep destructive actions gated behind confirmation inputs or modals.
- New settings panels should live in `components/` with co-located helpers/tests when specific to settings.
