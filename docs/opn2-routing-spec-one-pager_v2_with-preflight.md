# Opn2 SPA Routing Spec — One-Pager (v2)
**Version:** 2025-11-09 · **Scope:** Alpha (Family Management feature) · **Audience:** Dev/QA/PM  
**Definitions:** *Route* = URL; *Page* = top route component; *Main* = feature composition; *View state* = tab/mode selected within a page.

---

## 1) Route Map (authoritative)
| Route (path) | Page component | Main component | View state(s) | Notes |
|---|---|---|---|---|
| `/family-management` | `pages/FamilyManagement.tsx` | `components/FamilyManagement.tsx` | `dashboard` (empty) \| `tree` \| `generation` \| `members` | Default entry; uses `?tab=` and optional query params (below). |
| `/family-management/:familyId` | `FamilyManagement` | `FamilyManagement` | `info` (default) | Family Unit selected; redirects to `?tab=info` if none provided. |
| `/family-management/:familyId/tree` | `FamilyManagement` | `FamilyTreePanel` | `tree` | Canonical deep link for Tree view. Mirrors `?tab=tree`. |
| `/family-management/:familyId/members` | `FamilyManagement` | `FamilyMembersPanel` | `members` | Canonical deep link for Members roster. |
| `/family-management/:familyId/relationship-cards` | `FamilyManagement` | `RelationshipCardsPanel` | `relationship-cards` | CARD inventory (relationships). |
| `/family-management/:familyId/family-cards` | `FamilyManagement` | `FamilyCardsPanel` | `family-cards` | CARD inventory (family-unit). |
| `/family-management/:familyId/settings` | `FamilyManagement` | `FamilySettingsPanel` | `settings` | Admin-only sections gated by role. |
| `/family-management/:familyId/invitations` | `FamilyManagement` | `FamilyInvitesPanel` | `invitations` | Create/manage invitation tokens. |

> **Routing style:** SPA client-side routing (React). All “tab” views also supported via `?tab=` on the base family route for shareable deep links.

---

## 2) Query Params (normalized)
- `tab`: one of `dashboard | tree | generation | members | info | relationship-cards | family-cards | settings | invitations`  
  - Default: on `/family-management` = `dashboard`; on `/:familyId` = `info`.
- `gen`: integer (e.g., `0,1,2,...`) — active band in Generation View.
- `q`: string — search term (Members/CARDs).
- `sort`: string — e.g., `name_asc`, `updated_desc`.
- `filter`: string — pipe-delimited tokens (e.g., `role:admin|verified:true`).
- `node`: string — personId for Tree node focus; opens member drawer if present.
- `page`: integer — pagination index where applicable.

> **Behavior:** Unknown params are ignored. Unknown `tab` falls back to default for the route. Params are persisted across in-app navigation when semantically compatible.

---

## 3) Expected View States (by screen)
**Empty account (no Family Unit):**
- `/family-management?tab=dashboard` → “General Family Management Dashboard (empty)” with CTAs: **Create Family**, **Invite**, **Import CSV**.
- `/family-management?tab=tree|generation|members` → Empty-state scaffolds with same CTAs.

**Configured Family Unit (`:familyId`):**
- `?tab=info` → **Family Information** (profile form).  
- `?tab=members` → **Family Members** (roster with search/sort).  
- `?tab=relationship-cards` → **Relationship CARDs** (list + issue/revoke).  
- `?tab=family-cards` → **Family CARDs** (list + create/edit).  
- `?tab=settings` → **Family Settings** (roles/permissions/privacy).  
- `?tab=invitations` → **Family Invitations** (issue/track tokens).  
- `?tab=tree` → **Family Tree** (graph; `node` param focuses drawer).  
- `?tab=generation&gen=<n>` → **Generation View** (band `<n>` highlighted).

---

## 4) Navigation & Redirect Rules
1. Visiting `/family-management/:familyId` with no `tab` **redirects** to `?tab=info`.
2. Visiting `/family-management` with no `tab` **sets** `?tab=dashboard`.
3. Selecting a top tab **pushes** a URL change updating `tab` (and relevant params) to keep the view **shareable** and **QA-reproducible**.
4. Invalid or unauthorized `:familyId` → route to `/family-management?tab=dashboard` with toast: *“Family not found or access denied.”*
5. Role-gated tabs (e.g., `settings`, `invitations`) are hidden if unauthorized; deep link shows 403 inline message with “Back to Info”.

---

## 5) Component Contracts (minimum)
- **Page (`FamilyManagement`)**: reads `:familyId` and query params; resolves data (auth + family context) and mounts child panels. Shares `FamilyContext` (id, roles, feature flags).
- **Panels**: pure feature components; read context + params; emit `navigate(nextUrl)` for stateful transitions.
- **Tabs**: use shadcn/ui `Tabs` with explicit `value` bound to `tab` param; do **not** rely on internal data-state classes alone.

---

## 6) Empty-State & Error Behavior
- Empty dashboards must present **Create Family** as primary action; secondary: **Invite**, **Import CSV**, **Learn more**.
- Network/API errors: inline error blocks with **Retry**; do not route away.
- 404/403 family access: inline message + safe back link.

---

## 7) Analytics (event names)
- `fm_tab_viewed` {{ tab, familyId? }}
- `fm_member_opened` {{ personId, source: "tree|members|search" }}
- `fm_invite_created` {{ familyId, role, method: "link|email" }}
- `fm_card_issued` {{ cardType: "relationship|family", subjectId }}
- `fm_settings_saved` {{ section }}

---

## 8) Deep-Link Examples (copy-paste)
- Empty dashboard: `/family-management`
- Family info: `/family-management/abc123?tab=info`
- Tree focused on a node: `/family-management/abc123?tab=tree&node=person_42`
- Generation band 2: `/family-management/abc123?tab=generation&gen=2`
- Members search for “kirkland”: `/family-management/abc123?tab=members&q=kirkland`
- Relationship CARDs filtered to verified: `/family-management/abc123?tab=relationship-cards&filter=verified:true`

---

## 9) Access Control (summary)
- **Owner/Admin:** full access including `settings`, `invitations`, all CARD operations.
- **Member:** read tree/members/cards; limited edits on self (config flag).
- **Guest (invite-pending):** limited read if enabled by family privacy settings.

---

## 10) Implementation Notes
- Keep router paths **authoritative**; treat `?tab=` as first-class state.
- Co-locate parsing/writing of params in a small `useRouteState()` hook.
- Prefer **idempotent** URL transitions (replace vs push) for passive state (e.g., highlighting a node) to maintain a clean history.

---

## 11) Pre-flight + QA Gate (Authoritative)

**Purpose:** prevent regressions and unstated-assumption bugs when implementing the visible “location ring” and the 7‑icon top grid across Family Management routes.

### A) Pre-flight (do BEFORE coding)
1. **Color tokens:** This project uses **semantic tokens**. Replace palette examples (e.g., `ring-blue-500`) with **`ring-primary`** and **`focus-visible:ring-primary`**. If a different semantic name is used (e.g., `ring-brand`), use it consistently.
2. **Authoritative control:** The **top 7‑icon grid** is the **primary location control**. Implement it as **controlled Tabs bound to `?tab=`** (preferred) or as **controlled Links** that set `?tab=`. Do not mix models within this grid.
3. **Active location ring:** The active trigger **must** show a persistent ring using:  
   `data-[state=active]:ring-2 data-[state=active]:ring-offset-2 data-[state=active]:ring-primary data-[state=active]:ring-offset-background`  
   and **keep** the keyboard ring:  
   `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary`.
4. **Neutralize shadcn defaults on active:**  
   `data-[state=active]:bg-transparent data-[state=active]:shadow-none`
5. **Padding / clipping:** The trigger element must have `rounded-xl p-2`. The parent `TabsList` should have `p-3 rounded-2xl bg-muted/40 gap-3`. Avoid `overflow-hidden` on any immediate parent that would clip rings.
6. **Tailwind build:** If you’ve previously seen purge issues, add a safelist for:  
   `data-[state=active]:ring-2`, `data-[state=active]:ring-offset-2`, `data-[state=active]:ring-primary`, `data-[state=active]:ring-offset-background`.

### B) QA Gate (do BEFORE merge)
- **Presence:** The **7 icons** render on all Family Management pages (empty, info, members, relationship-cards, family-cards, settings, invitations).  
- **URL state:** Clicking any icon updates the URL to `?tab=<value>`; loading a deep link (e.g., `?tab=tree`) selects the correct icon.  
- **Location ring:** The selected icon shows the persistent ring; keyboard navigation shows the focus-visible ring on top.  
- **No clipping:** Rings are fully visible at all breakpoints.  
- **Back/Forward:** Browser navigation restores both the correct view and the correct ring.  
- **No bleed-over:** Styling changes to the top grid **do not** alter inner controls (e.g., Invitations segmented control).

### C) Ship-stopper checklist (must be green)
- [ ] 7‑icon grid present and bound to `?tab=`
- [ ] Active icon displays persistent ring
- [ ] `focus-visible` ring present via keyboard
- [ ] No ring clipping at any viewport
- [ ] Deep links + Back/Forward work
- [ ] Inner segmented controls unaffected

---

## 12) Appendix: Reference Implementation Snippets

### A) `useRouteState()` Hook
```ts
// src/hooks/useRouteState.ts
import { useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type RouteState = {
  get: (key: string) => string | null;
  set: (updates: Record<string, string | number | boolean | undefined | null>, opts?: { replace?: boolean }) => void;
  all: URLSearchParams;
};

export function useRouteState(): RouteState {
  const navigate = useNavigate();
  const location = useLocation();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const get = useCallback((key: string) => params.get(key), [params]);

  const set = useCallback(
    (updates: Record<string, string | number | boolean | undefined | null>, opts?: { replace?: boolean }) => {
      const next = new URLSearchParams(params);
      Object.entries(updates).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") next.delete(k);
        else next.set(k, String(v));
      });
      const url = `${location.pathname}?${next.toString()}`;
      if (opts?.replace) navigate(url, { replace: true });
      else navigate(url);
    },
    [location.pathname, navigate, params]
  );

  return { get, set, all: params };
}
```

**Example usage:**
```ts
import { useRouteState } from "@/hooks/useRouteState";

function FamilyManagementTabs() {
  const route = useRouteState();
  const tab = route.get("tab") ?? "info"; // default

  const onTabChange = (next: string) => {
    route.set({ tab: next, page: 1 }); // reset pagination when switching tabs
  };

  // ...render tabs with `tab` and `onTabChange`
}
```

---

### B) Tabs wired to `?tab=` (shadcn/ui Example)
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRouteState } from "@/hooks/useRouteState";

const VALID_TABS = ["info","members","relationship-cards","family-cards","settings","invitations","tree","generation"] as const;
type TabKey = typeof VALID_TABS[number];

function normalizeTab(input: string | null, fallback: TabKey = "info"): TabKey {
  return (VALID_TABS as readonly string[]).includes(input ?? "") ? (input as TabKey) : fallback;
}

export default function FamilyManagement() {
  const route = useRouteState();
  const current = normalizeTab(route.get("tab"));

  return (
    <Tabs
      value={current}
      onValueChange={(next) => route.set({ tab: next })}
      className="w-full"
    >
      <TabsList className="grid grid-cols-4 gap-2 rounded-2xl bg-muted/40 p-2">
        <TabsTrigger
          value="info"
          className="rounded-xl px-4 py-3 transition data-[state=active]:ring-2 data-[state=active]:ring-offset-2 data-[state=active]:ring-primary data-[state=active]:ring-offset-background data-[state=active]:shadow-none data-[state=active]:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
        >
          Info
        </TabsTrigger>

        <TabsTrigger value="tree" className="rounded-xl px-4 py-3 transition data-[state=active]:ring-2 data-[state=active]:ring-offset-2 data-[state=active]:ring-primary data-[state=active]:ring-offset-background data-[state=active]:shadow-none data-[state=active]:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary">
          Tree
        </TabsTrigger>
        <TabsTrigger value="generation" className="rounded-xl px-4 py-3 transition data-[state=active]:ring-2 data-[state=active]:ring-offset-2 data-[state=active]:ring-primary data-[state=active]:ring-offset-background data-[state=active]:shadow-none data-[state=active]:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary">
          Generation
        </TabsTrigger>

        {/* Repeat for the remaining tabs... */}
      </TabsList>

      <TabsContent value="info">{{/* Family Information panel */}}</TabsContent>
      <TabsContent value="members">{{/* Members roster */}}</TabsContent>
      <TabsContent value="relationship-cards">{{/* Relationship CARDs */}}</TabsContent>
      <TabsContent value="family-cards">{{/* Family CARDs */}}</TabsContent>
      <TabsContent value="settings">{{/* Settings */}}</TabsContent>
      <TabsContent value="invitations">{{/* Invitations */}}</TabsContent>
      <TabsContent value="tree">{{/* Tree view */}}</TabsContent>
      <TabsContent value="generation">{{/* Generation view */}}</TabsContent>
    </Tabs>
  );
}
```
