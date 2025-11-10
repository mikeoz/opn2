# Opn2 Project Glossary v1

**Date:** 2025-11-09  
**Purpose:** Establishing shared, precise language for UI elements, route logic, and visual behaviors across all engineering, design, QA, and documentation phases.

---

## Core Terms

| Term | Definition | Example Usage |
|------|------------|----------------|
| **Tab** | A routed section of the Family Management screen, driven by `?tab=` query param. | “The user is on the `?tab=invitations` view.” |
| **Tab Trigger** | An icon/button that switches the route via `?tab=...` | “The Tree icon is a `TabsTrigger` for `tab=tree`.” |
| **Highlight Ring** | A visible outline (ring) indicating which tab is active. Usually styled with Tailwind `ring-*` classes. | “Apply `ring-primary` to the active `TabsTrigger`.” |
| **Nav Bar (Grid)** | The row of icon-based tabs at the top of Family Management. Can be 3-icon or 7-icon variant. | “Render the 7-icon nav grid for management views.” |
| **Pill** | A capsule-shaped control used for segmenting data inside a view (e.g., ‘Pending’ vs ‘Accepted’ in Invitations). | “The ring should not appear on the ‘Pending’ pill.” |
| **Segmented Control** | A UI component grouping two or more pills to filter content. Not linked to routes. | “The segmented control filters invitations but doesn’t control routing.” |
| **Family View Icons** | The 3 icons: Tree, Generation, Members — shown in the compact nav bar. | “Only render Family View Icons when `tab=tree`, `generation`, or `members`.” |
| **Management View Icons** | The full 7 icons shown in extended nav bar for cards, settings, etc. | “Render the full grid for `tab=invitations` and other management tabs.” |
| **Focus Ring** | A keyboard-accessible outline that appears on focus (`focus-visible`) for accessibility. Distinct from highlight ring. | “Retain the focus ring when tabbing, in addition to the highlight ring.” |
| **Tab State** | The current selected tab value from the route (`tree`, `generation`, etc.) | “Set tab state from `useSearchParams()` at component mount.” |
| **Overflow Clipping** | A layout issue where the ring or icon is visually cut off due to parent containers using `overflow-hidden`. | “Avoid overflow clipping around the TabsList container.” |

---

## Usage Guidelines

- This glossary defines a **shared language** across all roles (Project Executive, Consulting Engineer, Development Team, QA).
- When writing or reviewing specs, use these terms to refer to elements in screenshots, route maps, and UI markup.
- When in doubt, default to this glossary’s name for an element rather than inventing a local name in a comment or commit.

---

## Maintenance

- Revisit and expand this glossary as new screens, patterns, or components are introduced.
- Link this file in the Routing Spec, Task Specs, and QA Checklists for consistent reference.

**Filename:** `docs/Opn2_Glossary_v1.md`
