# Opnli Cards Architecture (MVP) — Narrative & Implementation Guide

**Date:** 2025-10-05 23:50:41Z  
**Scope:** Import .vcf (vCard 3.0, Apple-first) → Normalize into Cards → Invitation Update → Field-Level Sharing → vCard 3.0 Export

---

## 1. Why this structure?
Opnli’s product differentiation is **maximum, field-level control** over what gets shared with whom. Traditional contact apps operate at a “record” or “label” level; we need granularity like **share DOB month/day but hide year**. The chosen structure makes *every facet* of a person a **typed Card** wrapped by a standard **envelope** that carries **provenance**, **verification**, **consent**, **per-field policies**, and **audit**. This keeps the core model stable while adapters handle ecosystem quirks (Apple `X-…` fields, CSVs, etc.).

Key benefits:
- **Standards-first**: vCard 3.0 for round-trip; future switch for 4.0 without refactor.
- **Composable**: add new card types (e.g., `licenseCARD`, `emergencyCARD`) without impacting others.
- **Trustworthy**: provenance + versioning enable deterministic merges and troubleshooting.
- **Privacy-by-design**: field policies let users and admins express fine-grained consent (and later, AI-agent scopes).
- **Operable**: JSON Schemas validate payloads; TypeScript engines encapsulate merge & policy logic.

---

## 2. What’s included here
- **JSON Schemas** for the base envelope and key card types (identity, address, phone, email, relationship, date, social, org member, calendar), plus **field policy** and **share contract** schemas.  
- An **Apple vCard 3.0 adapter mapping** (YAML spec) describing how to translate common properties—incl. `itemN.X-ABLabel`, `X-ABDATE`, `X-ABRELATEDNAMES`—into cards.
- **TypeScript skeletons** for the **Merge Engine** (confidence + precedence + recency) and the **Policy Engine** (field-level filtering for a given audience).
- **Fixtures** placeholders and a structure ready for tests.

---

## 3. How it’s expected to be implemented (step-by-step)

### 3.1 Parsing & Normalization
1. **Parse vCard 3.0** (allow 2.1 fallback): keep grouped `itemN.` and Apple `X-…` fields intact.
2. **Apply the adapter mapping** (`adapters/vcard3_apple_mapping.yaml`) to create typed cards. Save **provenance** (`source_system: apple_vcard_3.0`, `raw_ref: itemN`).
3. **Normalize** values:
   - Phones → **E.164** (derive region from address country, fallback to user’s locale).
   - Emails → lowercase domain; split username/domain.
   - Addresses → split with libpostal; keep `X-APPLE-SUBLOCALITY`; store ISO country.
4. **Index** canonical keys: `email.address`, `phone.e164`, `UID`.

### 3.2 Dedupe & Merge
- Run blocking on (email, phone, UID) and fuzzy on (first+last+org).  
- Use **merge precedence** (self-asserted > invite-update > first-party > third-party).  
- The **Merge Engine** (see `src/merge_engine.ts`) picks winners per field and records conflicts for UI.

### 3.3 Invitation & Verification Flow
- Generate an `invitationCARD` with **prefill** and a **share contract**.  
- Send secure link → invitee verifies via **email/phone OTP**.  
- Invitee edits fields; server validates (E.164, email RFC, address).  
- Merge as **self-asserted** updates; attach **consent receipts**.

### 3.4 Sharing & Views
- Each card has a **default scope** and optional `fieldPolicies` (per-path).  
- The **Policy Engine** (`src/policy_engine.ts`) produces a filtered view of a Person for a specific viewer (inviter, group, public, agent).  
- Example: `dateOfBirth.month,day` visible to `group:classParents2025`, `dateOfBirth.year` stays private.

### 3.5 Export (Round-trip)
- Emit **vCard 3.0** with Apple-friendly extensions:
  - Custom labels → `itemN.X-ABLabel`  
  - Related names → `X-ABRELATEDNAMES` + label  
  - Extra dates → `X-ABDATE` + `X-ABLabel:Anniversary`  
  - Address extras → `X-ABADR`, `X-APPLE-SUBLOCALITY`  
- Add a feature flag later to export **vCard 4.0** using `ANNIVERSARY`, `RELATED;TYPE=…`, `SOCIALPROFILE`.

---

## 4. Troubleshooting playbook

**Issue:** Phone numbers not matching during dedupe.  
**Check:** Region inference for E.164; ensure country from `addressCARD.country` or user locale is passed to the normalizer.  
**Fix:** Fallback to a configurable default country; log numbers that fail parsing.

**Issue:** Anniversary missing from Apple import.  
**Check:** Look for `itemN.X-ABDATE`+`itemN.X-ABLabel:Anniversary`; some exports omit the canonical `ANNIVERSARY`.  
**Fix:** Ensure adapter recognizes the Apple pattern and maps to `dateCARD`.

**Issue:** Custom labels lost on export.  
**Check:** `custom_label` preserved?  
**Fix:** On vCard 3.0 export, emit `itemN.X-ABLabel: <label>` in addition to `TYPE`.

**Issue:** DOB year leaking to unintended audience.  
**Check:** `fieldPolicies` path correctness (e.g., `data.dateOfBirth.year`).  
**Fix:** Add unit tests for policy engine with sample fieldPolicies and audiences.

**Issue:** Merge oscillation across imports.  
**Check:** Precedence and confidence settings; `REV`/timestamps.  
**Fix:** Persist the chosen canonical; only override with strictly higher confidence or newer self-asserted data.

---

## 5. Security, privacy, and retention (MVP defaults)
- **Raw artifacts**: store encrypted; **purge after 30 days**; keep SHA-256 only.
- **Normalized data**: retained until user deletes; **Row-Level Security** in DB.
- **Consent receipts**: append-only; keep **2 years** (configurable).  
- **Backups**: 35-day rolling; documented restore drills.  
- **DLP scanning**: block secrets in Notes; auto-redact on export where policy requires.

---

## 6. Extensibility notes (vCard 4.0 and beyond)
- Keep exporter with a **feature-flag switch** (3.0 vs 4.0).  
- Add 4.0 fields when ecosystem warrants: `ANNIVERSARY`, `RELATED;TYPE`, `SOCIALPROFILE`.  
- Introduce **agent** scope defaults and rate-limited purpose binding for AI usage.

---

## 7. Definition of Done (MVP)
- Import Apple vCard 3.0; create typed cards with provenance.  
- Invite flow; OTP verify; **field-level** edits & consent.  
- Deterministic merge; conflict UI ready.  
- vCard 3.0 export re-imports into Apple with labels intact.  
- Raw artifact retention job and consent receipts live.

---

## 8. File map (this drop)
- `schemas/base/card_envelope.schema.json`  
- `schemas/policy/field_policy.schema.json`  
- `schemas/policy/share_contract.schema.json`  
- `schemas/types/*.schema.json` (identity, address, phone, email, relationship, date, social, org member, calendar)  
- `adapters/vcard3_apple_mapping.yaml`  
- `src/merge_engine.ts`, `src/policy_engine.ts`  
- `docs/Opnli_Cards_Architecture_MVP.md`

---

**Next steps:** Wire the adapter to your parser, add unit tests with the fixtures, and integrate the policy engine into the invitation view APIs.
