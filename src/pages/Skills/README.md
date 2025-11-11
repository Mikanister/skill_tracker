# Skills Page Module

## Purpose
Manages skill catalog browsing, editing, and statistics for fighters.

## Structure
- `Skills.tsx` – Route entry point controlling view state (selected skill, modals).
- `components/` – Skill-specific UI blocks: lists, detail panels, charts.

## Data Flow
- Fetches from hooks in `@/hooks/skills` and `@/hooks/fighters` to render aggregated stats.
- Keeps modal state (view/edit/category) centralized while passing derived props to modal components.

## Patterns & Conventions
- All modals adopt `Modal` + `ModalActions` for consistent footer interactions.
- Shared cards and headers leverage `SectionCard` and `PageHeader` primitives.
- When adding new skill-related widgets, colocate files under `components/` with optional domain-specific hooks.
