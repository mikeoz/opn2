# Opn2 First Principles Statement

**Date:** 2025-11-09  
**Context:** Project Engineering Discipline · Post-HRF-5 Recovery

---

## Why First Principles Matter

Recent regressions in the Opn2 system — including incorrect visual indicators, inconsistent navigation layouts, and misapplied logic — highlight the need for a clearer engineering discipline. Many of the mistakes were not the result of insufficient effort, but rather a lack of reasoning from foundational truths.

By adopting a **First Principles approach**, the team commits to breaking down each design and implementation challenge to its **fundamental purpose**, before applying abstractions, patterns, or AI tooling. This method leads to more durable code, clearer QA targets, and faster identification of regressions.

---

## Real Examples

### 1. Highlight Ring Misplacement
- **What failed:** The ring appeared on a nested control instead of the active top nav icon.
- **First Principle:** The UI must clearly show the user's current location. That means the ring must appear on the top-level icon that corresponds to the active view.

### 2. Broken Navigation Grid
- **What failed:** The 7-icon grid was incompletely or incorrectly restored.
- **First Principle:** Navigation must give users access to all key system areas, persistently and responsively.

### 3. Overuse of Tooling (e.g., Lovable.dev)
- **What failed:** Automated changes introduced layout breakage and inconsistent logic.
- **First Principle:** The cost of introducing “unknown correctness” outweighs speed. Persistent components (routing, state, layout) must be tested and validated with purpose.

---

## Implementation Commitment

> **All future system modifications will begin by reasoning from First Principles.**

Each new feature or correction will begin with a short, written First Principles summary that defines the non-negotiable purpose of the component or behavior. This summary will guide decisions about architecture, routing, visibility, styling, and testing.

For example:  
> “The highlight ring exists to show the user where they are. It must persist across views and reflect the route state.”

This discipline will apply to human and AI contributors alike. Every team member — whether coding by hand or using AI tooling — will be expected to **pause and restate the purpose of what they are changing**, and ensure that purpose is achieved clearly.

---

## How This Will Be Used

This document lives in `/docs/` and will be referenced:
- At the start of each work cycle.
- In all implementation specs (`_Task_Spec.md`), as the basis for architecture.
- In QA gates and postmortem reviews.
