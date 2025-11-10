# Opn2 First Principles Framework v1

**Date:** 2025-11-09  
**Purpose:** Define a clear, repeatable decision-making discipline for the Project Executive, Consulting Engineer, and Development Team.  
**Context:** Post-HRF-5 Recovery · Based on lessons learned from navigation regressions, inconsistent design logic, and communication challenges.

---

## 🚀 Overview

The Opn2 First Principles Framework is modeled after the engineering philosophy used by SpaceX — questioning assumptions, simplifying processes, and reasoning from the ground up.  
For Opn2, this framework ensures all design, code, and documentation decisions align with the core mission: **to help normal human beings (NHBs) easily see, organize, and share what matters in their relationships.**

---

## The Six Opn2 First Principles

### 1. Question Every Assumption
> “Assume nothing. Ask: why must this exist, look this way, or work this way?”

- Challenge inherited structures and conventions.
- Every design and technical choice must map to a clear user-facing purpose.
- Avoid “we’ve always done it this way” reasoning.

**Example:** Before adding a new button or menu, ask: *Would a non-technical user instantly understand its purpose?* If not, rethink.

---

### 2. Design for Purpose (Not Process)
> “We serve the human, not the system.”

- Every element — from data model to icon — must serve a clear human purpose.  
- The NHB (Normal Human Being) experience defines correctness.
- Avoid abstractions that make life easier for developers but harder for users.

**Example:** The highlight ring exists solely to show where a user is in the system. If the ring appears anywhere else, it violates this principle.

---

### 3. Simplify Ruthlessly
> “Simplicity is not minimalism — it’s clarity made visible.”

- Remove every unnecessary step, label, or control.
- Use plain language across documentation, UI, and code.
- Every element must earn its place.

**Example:** Merge redundant icons or menus; replace jargon with human-readable hints.

---

### 4. Accelerate Understanding, Not Just Delivery
> “Speed matters — but clarity compounds.”

- Optimize for shared understanding before code speed.
- Each iteration should increase team insight about what’s working.
- Record a brief “First Principles Note” before and after each feature.

**Example:**  
Before commit → “This change aligns 7-icon nav with route state.”  
After merge → “Verified active ring correctly tracks tab state.”

---

### 5. Keep Humans Connected
> “Relationships are the system.”

- Every change should make people feel more connected or informed.
- Prioritize transparency and comprehension over automation.
- Build for trust — people first, features second.

**Example:** When creating “Invite” flows, prioritize clarity of who can see what before adding automation.

---

### 6. Automate Last — and Only What’s Proven
> “Automate clarity, not confusion.”

- Do not automate processes that are unclear or untested.  
- Use automation for consistency and repeatability, not as a substitute for understanding.
- Let humans prove correctness before machines replicate it.

**Example:** Automate validation of route states or linting, not interface logic that impacts visibility or state.

---

## 🔁 Implementation Practice

Each HRF (High-Resolution Feature) cycle must begin with:

- **A First Principles Note** – 2–3 sentences defining the non-negotiable purpose of the change.  
- **Glossary References** – ensure shared terminology for every UI element.  
- **Verification Step** – confirm the feature behaves according to its First Principle.

This process aligns with OKR-style structure: the *Objective* is the First Principle; the *Key Results* are testable confirmations.

---

## 📘 Summary Table: The Opn2 Five (Plus One)

| Step | Principle | Key Question | Expected Outcome |
|------|------------|---------------|------------------|
| 1 | **Question Every Assumption** | “Why must this exist?” | Removes arbitrary complexity |
| 2 | **Design for Purpose** | “How does this help an NHB?” | Keeps system human-centered |
| 3 | **Simplify Ruthlessly** | “What can we remove?” | Increases clarity |
| 4 | **Accelerate Understanding** | “Did we all learn from this?” | Improves quality and learning speed |
| 5 | **Keep Humans Connected** | “Does this strengthen relationships?” | Builds trust and meaning |
| 6 | **Automate Last (and Wisely)** | “Is this proven and repeatable?” | Scales without breaking clarity |

---

## 🔗 Cross-References

- **Glossary:** [`Opn2_Glossary_v1.md`](Opn2_Glossary_v1.md) – for shared terminology and UI element names.  
- **Routing Spec:** [`opn2-routing-spec-one-pager_v2_with-preflight.md`](opn2-routing-spec-one-pager_v2_with-preflight.md) – defines route behavior linked to these principles.  
- **QA Checklists:** Ensure “First Principles Verification” is included before merge.

---

**Filename:** `docs/Opn2_First_Principles_Framework_v1.md`  
**Maintained by:** Consulting Engineer (with Project Executive oversight)
