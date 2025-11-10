# Opn2 Documentation Catalog

This folder is the **authoritative source** for specs, checklists, QA notes, and lessons learned.  
Use this catalog to find the latest, in-force documents.

> Legend: **[SPEC]** = implementation spec · **[QA]** = verification/QA · **[CHK]** = reviewer checklist · **[AI]** = action instruction · **[LL]** = lessons learned · **[ARCH]** = archived/superseded

---

## 1) Start Here
- **[FIRST PRINCIPLES]**
  'https://github.com/mikeoz/opn2/blob/main/docs/Opn2_First_Principles_Statement.md'
- **[SPEC] Opn2 SPA Routing Spec — One-Pager (with snippets)**  
  `opn2-routing-spec-one-pager_with-snippets.md`
- **[LL] Lessons Learned (engineering notes & postmortems)**  
  `Lessons_Learned.md`

---

## 2) Active Iteration (HRF-4)
- **[AI] AI_HRF-4_09NOV25** (Action Instruction initiating the HRF-4 work cycle)  
  _(upload if missing)_ `AI_HRF-4_09NOV25.md` or `.pdf`
- **[SPEC] AI_HRF-4_Task_Spec_09NOV25** (authoritative build spec for Dev Team)  
  _(upload if missing)_ `AI_HRF-4_Task_Spec_09NOV25.md`
- **[CHK] PR Reviewer Checklist — Family Management**  
  _(upload if missing)_ `opn2-pr-reviewer-checklist.md`
- **[QA] 04b-11_v0.4_CE_QA_09NOV25** (QA memo and verification results)  
  _(upload if missing)_ `04b-11_v0.4_CE_QA_09NOV25.md` or `.pdf`

**Control Flow:** `AI → Task_Spec → PR + CHK → QA → LL`

---

## 3) Specs (by feature/module)
- **[SPEC] Family Management / Routing & Tabs**  
  `opn2-routing-spec-one-pager_with-snippets.md`
- **[SPEC] (Reserved) Visual Location Indicator (7-Icon Grid) — Pattern**  
  _Create when finalized_ → `ui-location-ring-pattern.md`

---

## 4) Checklists & Gates
- **[CHK] PR Reviewer Checklist — Family Management (7-Icon Grid + Routing)**  
  _(upload if missing)_ `opn2-pr-reviewer-checklist.md`
- **[CHK] Release Candidate Gate (reserved)**  
  _Create when needed_ → `release-candidate-gate.md`

---

## 5) QA & Test Artifacts
- **[QA] 04b-11_v0.4_CE_QA_09NOV25**  
  _(upload if missing)_ `04b-11_v0.4_CE_QA_09NOV25.md` or `.pdf`

---

## 6) Lessons Learned
- **[LL] Tailwind semantics & data-state variants (ring / focus-visible)**  
  `Lessons_Learned.md`

---

## 7) Archive
- **[ARCH] (placeholder)** Move superseded or old versions here.  
  Suggested names: `archive/<original-filename>`

---

## 8) Naming Convention (Quick Reference)
- **Action Instruction:** `AI_<Topic>-<Cycle>_<YYYYMONDD>`  
- **Engineering Task Spec:** `AI_<Topic>-<Cycle>_Task_Spec_<YYYYMONDD>`  
- **QA Memo:** `04b-11_v<major.minor>_CE_QA_<YYYYMONDD>`  
- **Reviewer Checklist:** `04b-11_Opnli_PE_Reviewer_Checklist_<YYYYMONDD>`  
- **Lessons Learned:** `LL_<Topic>_<YYYYMONDD>`

Keep suffixes consistent: `_Spec`, `_QA`, `_Checklist`, `_Task`, `_ARCH`.

---

## 9) What’s authoritative?
- If a document exists **both** as `.md` and `.pdf`, the **Markdown** is authoritative for text; the PDF is for distribution.
- Specs in this catalog are binding until replaced by a newer spec with a later date.

