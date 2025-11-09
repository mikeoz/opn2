# Lessons Learned: Opn2 Project

## Overview
This document captures key design and development decisions, challenges encountered, and solutions implemented throughout the Opn2 project. It serves as a reference for current and future developers to understand the project's evolution and avoid repeating past mistakes.

---

## Design System & Styling

### Lesson: Tailwind Color Configuration vs. Semantic Tokens (November 2025)

**Context:**  
We implemented a "persistent highlight ring" feature to improve navigation wayfinding across tab interfaces. The requirement was for a 2px solid blue ring with a 2px offset around active tab triggers.

**Initial Implementation:**  
Applied `ring-blue-500` utility class directly to the `data-[state=active]` state of `TabsTrigger` components in `src/components/ui/tabs.tsx`.

**Problem Encountered:**  
The highlight ring did not appear in the UI, despite the CSS classes being correctly applied to the DOM elements. Testing revealed:
- The `focus-visible:ring-2 focus-visible:ring-ring` worked correctly (using semantic tokens)
- The `data-[state=active]:ring-blue-500` did not work

**Root Cause Analysis:**  
The project's `tailwind.config.ts` only defined semantic color tokens (e.g., `primary`, `secondary`, `muted`) using HSL variables from `index.css`. Tailwind's default color palette (including `blue-500`, `red-500`, etc.) was not included in the configuration. Therefore, utility classes like `ring-blue-500` were not generated during the build process.

**Solution:**  
Extended `tailwind.config.ts` to include Tailwind's default blue color palette:

```typescript
colors: {
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    // ... full blue palette
    950: '#172554',
  },
  border: 'hsl(var(--border))',
  // ... semantic tokens
}
```

**Key Takeaways:**
1. **Color Availability**: Tailwind utility classes are only available for colors explicitly defined in `tailwind.config.ts`. If a color palette is not extended into the config, its utility classes won't exist.
2. **Semantic vs. Named Colors**: The project follows a semantic token approach (using CSS custom properties) for brand consistency. However, specific UI requirements may necessitate named color utilities from Tailwind's default palette.
3. **Testing Approach**: When a Tailwind utility class doesn't work, verify it exists in the generated CSS by checking the config and build output.
4. **Documentation**: Always document when adding non-semantic colors to explain the design rationale and prevent future confusion.

**Files Modified:**
- `tailwind.config.ts` - Added blue color palette
- `src/components/ui/tabs.tsx` - Applied `data-[state=active]:ring-2 data-[state=active]:ring-blue-500 data-[state=active]:ring-offset-2`

**Design Decision:**  
We chose to add the blue palette rather than using `ring-primary` because:
- The design specification explicitly called for blue-500
- Primary color may change across themes/brands
- Accessibility and wayfinding benefit from a consistent, recognizable color

---

## Authentication & User Management

_[Future lessons to be documented here]_

---

## Database & Data Model

_[Future lessons to be documented here]_

---

## Component Architecture

_[Future lessons to be documented here]_

---

## Performance & Optimization

_[Future lessons to be documented here]_

---

## Integration Challenges

_[Future lessons to be documented here]_

---

## Document Maintenance

**How to Add New Lessons:**
1. Choose the appropriate section or create a new one
2. Use the template format: Context → Implementation → Problem → Root Cause → Solution → Key Takeaways
3. Include specific file paths and code snippets where relevant
4. Date the lesson for historical tracking
5. Link to related documentation or design memos when applicable

**Last Updated:** November 9, 2025
