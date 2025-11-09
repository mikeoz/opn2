# Opn2 PR Reviewer Checklist — Family Management (One Page)
**Version:** 2025-11-09 · **Scope:** Ringed 7‑Icon Grid + Routing · **Audience:** Code reviewers, QA, PM

> Use this page to block regressions. If any item fails, request changes.

---

## 1) Scope Confirmation
- [ ] This PR changes **only**: top 7‑icon location grid, its styles, or routing/query handling (`?tab=`) in Family Management.
- [ ] No unrelated UI elements are modified (e.g., Invitations “Pending/Accepted” segmented control).

## 2) Pre‑flight (environment & conventions)
- [ ] Uses **semantic color** tokens (e.g., `ring-primary`, `focus-visible:ring-primary`), or an approved palette extension.
- [ ] Top grid implemented as **controlled Tabs bound to `?tab=`** (preferred) or **controlled Links** setting `?tab=`.
- [ ] Active trigger styles include **all**:
  - `data-[state=active]:ring-2`
  - `data-[state=active]:ring-offset-2`
  - `data-[state=active]:ring-primary`
  - `data-[state=active]:ring-offset-background`
  - `data-[state=active]:bg-transparent`
  - `data-[state=active]:shadow-none`
- [ ] A11y ring preserved: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary`
- [ ] Trigger has padding/shape: `rounded-xl p-2`
- [ ] TabsList/container spacing: `p-3 rounded-2xl bg-muted/40 gap-3`
- [ ] No `overflow-hidden` on immediate parents that would clip rings
- [ ] (If purge issues seen) Tailwind **safelist** includes required `data-[state=active]:ring*` tokens

## 3) Visual Parity (screenshots required)
Attach fresh screenshots for **each** tab route below (mobile + desktop). Reject if the **7‑icon grid** is not visible or if the **active ring** is missing.
- [ ] `/family-management/:id?tab=info` — ring on **Info** icon
- [ ] `/family-management/:id?tab=members` — ring on **Members** icon
- [ ] `/family-management/:id?tab=relationship-cards` — ring on **Relationship CARDs** icon
- [ ] `/family-management/:id?tab=family-cards` — ring on **Family CARDs** icon
- [ ] `/family-management/:id?tab=settings` — ring on **Settings** icon
- [ ] `/family-management/:id?tab=invitations` — ring on **Invitations** icon
- [ ] `/family-management/:id?tab=tree` — ring on **Tree** icon
- [ ] `/family-management/:id?tab=generation` — ring on **Generation** icon

## 4) URL & State Behavior
- [ ] Clicking each icon updates the URL’s `?tab=` value
- [ ] Deep links load the correct view and ring (paste each URL above and verify)
- [ ] Browser **Back/Forward** restores view and ring
- [ ] No ring clipping at any breakpoint

## 5) Accessibility
- [ ] Tabbing to an icon shows the **focus-visible** ring layered over the persistent ring
- [ ] Icons have accessible labels (e.g., `aria-label="Tree"`)
- [ ] Color contrast of the ring meets design system guidance

## 6) Regression Guard
- [ ] The Invitations segmented control **still functions** and retains its own styles
- [ ] No layout shifts or lost components (7 icons remain visible on all Family Management screens)
- [ ] No global CSS overrides that unintentionally affect other components

## 7) Code Hygiene
- [ ] Re-usable **class string** or utility is centralized (no copy/paste divergence)
- [ ] If using Links: `isActive` logic is clear and unit-tested
- [ ] If using Tabs: controlled `value` + `onValueChange` are implemented; no mixed models in the same grid
- [ ] `useRouteState()` (or equivalent) used consistently to read/write query params

## 8) Sign‑off
- Reviewer: ____________________  Date: __________
- QA Lead: ______________________  Date: __________
- Product/Design: _______________  Date: __________
