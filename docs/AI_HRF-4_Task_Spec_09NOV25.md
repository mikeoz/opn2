# AI_HRF-4_Task_Spec_09NOV25
**Author:** Consulting Engineer (CE)  
**Date:** 2025-11-09  
**Scope:** Corrective Implementation Plan for 7‑Icon Grid + Highlight Ring  
**Project:** Opn2 — Family Management (Version 0.4)

---

## 1. Executive Overview: Coordinated Development Model

The `/docs` directory functions as the **authoritative control center** for all Opn2 development iterations. Each Markdown file represents a formal control document — defining standards, expectations, and verification procedures for each phase of work.

This model creates a **closed feedback loop** connecting the Project Executive, Consulting Engineer, and Development Team:

| Role | Primary Function | Deliverables |
|------|------------------|---------------|
| **Project Executive (PE)** | Issues the Action Instruction (AI) defining scope and goals. | `AI_HRF-4_09NOV25` |
| **Consulting Engineer (CE)** | Analyzes the problem, designs the corrective plan, and issues implementation specifications. | `AI_HRF-4_Task_09NOV25`, `AI_HRF-4_Task_Spec_09NOV25` |
| **Development Team (DT)** | Executes the plan as specified and documents results with tests and screenshots. | Pull request linked to `/docs` spec |
| **QA / Reviewers** | Validate outcomes using the Reviewer Checklist before merge. | `04b-11_Opnli_PE_Reviewer_Checklist_09NOV25` |

This approach ensures **traceability**, **clarity**, and **professional improvement** through structured documentation and defined accountability.

---

## 2. How the Development Team Should Use Documents in `/docs`

| File Type | Author | Function | Development Team Use |
|------------|---------|-----------|----------------------|
| **AI_HRF-4_09NOV25** | Project Executive | Defines the business and functional objective for the iteration. | Review scope and rationale before coding. |
| **AI_HRF-4_Task_09NOV25** | Consulting Engineer | Analysis and corrective plan confirmation with the Executive. | Understand root causes and proposed fix. |
| **AI_HRF-4_Task_Spec_09NOV25** | Consulting Engineer | Formal build specification for implementation and verification. | Follow precisely; test against QA Gate. |
| **04b-11_Opnli_PE_Reviewer_Checklist_09NOV25** | Project Executive | Defines QA validation before merge. | QA must check every item and attach screenshots. |
| **04b-11_v0.4_CE_QA_09NOV25** | Consulting Engineer | Records QA results and pass/fail status. | Reference during retrospectives. |

All artifacts should move in the following **control sequence**:  
**AI → Task → Spec → QA → Review → Lessons Learned (LL)**

---

## 3. Professional Improvement Through Documentation Discipline

This structure reinforces industry-standard engineering controls and promotes professional growth:

- **Traceability:** Each change is traceable to a specific instruction and test.  
- **Peer Learning:** Developers can understand the rationale behind changes, not just instructions.  
- **Consistency:** Shared Pre‑flight and QA Gate patterns minimize stylistic divergence.  
- **Accountability:** Clear authorship and document flow prevent blame-shifting and ensure learning.  
- **Institutional Knowledge:** The `/docs` directory becomes a permanent record of how Opn2 evolved.

---

## 4. File Naming Convention (for `/docs`)

| Purpose | Naming Format | Example |
|----------|---------------|----------|
| **Action Instruction** | `AI_<Topic>-<Cycle>_<Date>` | `AI_HRF-4_09NOV25` |
| **Engineering Task Report** | `AI_<Topic>-<Cycle>_Task_<Date>` | `AI_HRF-4_Task_09NOV25` |
| **Specification (Engineer → Dev Team)** | `AI_<Topic>-<Cycle>_Task_Spec_<Date>` | `AI_HRF-4_Task_Spec_09NOV25` |
| **QA Memo** | `04b-11_v<version>_CE_QA_<Date>` | `04b-11_v0.4_CE_QA_09NOV25` |
| **Reviewer Checklist** | `04b-11_Opnli_PE_Reviewer_Checklist_<Date>` | `04b-11_Opnli_PE_Reviewer_Checklist_09NOV25` |
| **Lessons Learned** | `LL_<Topic>_<Date>` | `LL_FamilyManagement_09NOV25` |

Use these suffixes consistently:  
- `_Spec` → directive/specification for execution  
- `_QA` → test verification results  
- `_Checklist` → gating document for approval  
- `_Task` → engineering analysis and corrective plan  

---

## 5. Corrective Implementation Plan (Technical Specification)

### Phase 1 — Environment & Branch Setup
- Create branch: `feature/family-management-ring-fix-v4`  
- Restore the 7‑icon **TabsList** (tree, generation, members, relationship‑cards, family‑cards, settings, invitations).  
- Ensure the component is controlled via `?tab=` query.

### Phase 2 — Correct Element Styling
Apply this class string **to each TabsTrigger** (top icon only):

```tsx
className="
  rounded-xl p-2 transition
  data-[state=active]:ring-2
  data-[state=active]:ring-offset-2
  data-[state=active]:ring-primary
  data-[state=active]:ring-offset-background
  data-[state=active]:bg-transparent
  data-[state=active]:shadow-none
  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-offset-2
  focus-visible:ring-primary
"
```

TabsList container example:

```tsx
<TabsList className="grid grid-cols-3 md:grid-cols-7 gap-3 rounded-2xl bg-muted/40 p-3" />
```

Ensure no parent element includes `overflow-hidden` that would clip rings.

### Phase 3 — Validation (QA Gate)
Use **04b‑11_Opnli_PE_Reviewer_Checklist_09NOV25** to verify:

- [ ] All 7 icons visible on every Family Management view  
- [ ] Correct `?tab=` updates and restores via URL  
- [ ] Active icon shows persistent ring and focus-visible ring  
- [ ] Browser Back/Forward restores view and ring  
- [ ] No clipping or shadow artifacts  

Attach new screenshots showing each tab route (desktop and mobile).

### Phase 4 — Documentation
- Update `/docs/Lessons_Learned.md` with:  
  - Explanation of semantic color token policy (`ring-primary`)  
  - Confirmation of Pre‑flight compliance and screenshots  

### Phase 5 — Review & Merge
- Title PR: **Fix: Restore 7‑icon grid + semantic highlight ring (per AI‑HRF‑4)**  
- Reviewers complete PR Checklist; QA Lead verifies screenshots; PE signs off.

---

## 6. Pre‑flight + QA Gate (Excerpt for Reference)

**Pre‑flight:**
1. Confirm semantic tokens exist (`ring-primary`, `focus-visible:ring-primary`).  
2. Verify TabsList/Links structure intact with 7 triggers.  
3. Validate padding, rounded corners, and no `overflow-hidden`.  
4. Add safelist if Tailwind purge removes data‑variant classes.  

**QA Gate:**
- 7 icons render correctly.  
- URL `?tab=` updates and restores.  
- Rings visible and not clipped.  
- Back/Forward works.  
- Invitations control unaffected.

---

## 7. Expected Outcome

Upon completion of this task, the Family Management module will:
- Display a consistent 7‑icon grid across all views.  
- Provide persistent, semantic highlight rings indicating active location.  
- Maintain accessibility and keyboard focus behavior.  
- Pass the full PR Reviewer Checklist without regression.

---

**Prepared by:** Consulting Engineer (CE)  
**Approved by:** Project Executive (PE) — pending upload to `/docs`  
**Filename:** `AI_HRF-4_Task_Spec_09NOV25.md`
