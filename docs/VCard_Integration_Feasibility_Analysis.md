# vCard Integration & Invitation System - Feasibility Analysis

## Executive Summary

**Overall Assessment: FEASIBLE with Strategic Modifications**

The proposed vCard 3.0-based invitation system is architecturally sound and technically implementable within the current opn2 platform. However, several strategic decisions and architectural refinements are needed to align this comprehensive design with the existing Supabase infrastructure and current CARD system.

---

## Key Questions & Recommendations

### 1. **Database Schema Alignment** ✅ FEASIBLE

**Current State:**
- Existing `user_cards` table with template-based architecture
- `card_templates` and `template_fields` for structured data
- `card_field_values` for granular field storage
- `card_relationships` for sharing

**Proposed State:**
- Typed CARD objects (phoneCARD, emailCARD, addressCARD, etc.)
- JSONB `data` column with card-type-specific schemas
- Enhanced provenance, verification, consent metadata

**Recommendation:**
We can extend the current schema rather than replace it:
- Add `card_type` enum to existing `user_cards` table
- Add JSONB columns: `provenance`, `verification`, `consent`, `field_policies`
- Create new `card_envelope` metadata structure
- Maintain backward compatibility with existing template system

**Migration Strategy:**
- Phase 1: Extend schema with new columns (non-breaking)
- Phase 2: Create vCard import pipeline that generates template-compatible cards
- Phase 3: Add field-level policy enforcement layer

---

### 2. **vCard 3.0 Import Pipeline** ✅ HIGHLY FEASIBLE

**Technical Approach:**
```typescript
// Pipeline stages:
1. Parse: vCard (3.0/4.0) → raw properties
2. Map: Apply adapter rules (Apple X-... extensions)
3. Normalize: E.164 phones, email validation, address parsing
4. Deduplicate: Email, phone, UID, fuzzy name matching
5. Create: Generate template-based cards or typed CARDs
```

**Implementation Path:**
- Create `src/utils/vcard/` directory structure:
  - `parser.ts` - vCard 3.0/4.0 parser
  - `appleAdapter.ts` - Handle X-ABLabel, X-ABRELATEDNAMES, etc.
  - `normalizer.ts` - E.164, email, address normalization
  - `mapper.ts` - Map vCard properties to CARD types
  - `deduplicator.ts` - Entity resolution logic

**External Libraries Needed:**
- `vcard-parser` or custom parser for vCard 3.0/4.0
- `libphonenumber-js` for E.164 normalization (already may be used)
- Address validation service or library

---

### 3. **Field-Level Granularity & Sharing** ✅ FEASIBLE (With Design Choice)

**Current System:**
- Template field-level granularity via `template_fields`
- Sharing via `card_relationships` with permissions JSONB

**Proposed Enhancement:**
```json
{
  "fieldPolicies": [
    {
      "path": "data.dateOfBirth.year",
      "scope": "private",
      "recipients": []
    },
    {
      "path": "data.dateOfBirth.month,day",
      "scope": "group",
      "recipients": ["group:classParents2025"]
    }
  ]
}
```

**Recommendation:**
Implement a **hybrid approach**:
1. **Card-Level Sharing** (MVP): Use existing `card_relationships` table
2. **Field-Level Policies** (Phase 2): Add `field_policies` JSONB column
3. **Runtime Policy Engine**: Create `src/utils/policyEngine.ts` to filter data at read-time

**Key Design Decision Required:**
- Should DOB be stored as `{ year, month, day }` objects for true granular control?
- Or use current template field approach with computed policies?

**Suggested Answer:** Use structured objects for core fields (DOB, addresses, phones) to enable true field-level control without creating excessive template fields.

---

### 4. **Invitation Flow Architecture** ✅ FEASIBLE

**Proposed Flow:**
```
1. Inviter imports .vcf → Parser creates draft Person + Cards
2. System generates invitationCARD with pre-filled data
3. Invitee receives secure link → Verify via email/phone OTP
4. Invitee edits fields → Validation (E.164, email, address)
5. Invitee consents to sharing → Field-level scopes
6. Merge engine applies updates with precedence rules
7. Both parties audit trail and revocation capability
```

**Database Tables Needed:**
```sql
-- New table for invitations
CREATE TABLE card_invitations (
  id UUID PRIMARY KEY,
  inviter_user_id UUID REFERENCES profiles(id),
  invitee_email TEXT NOT NULL,
  invitee_phone TEXT,
  invitation_token TEXT UNIQUE,
  status TEXT, -- 'pending', 'verified', 'accepted', 'expired'
  prefill_data JSONB, -- Pre-populated card data from .vcf
  requested_fields TEXT[], -- Which cards/fields requested
  share_contract JSONB, -- Default scopes and overrides
  expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provenance tracking for imported cards
CREATE TABLE card_provenance (
  id UUID PRIMARY KEY,
  card_id UUID REFERENCES user_cards(id),
  source_system TEXT, -- 'apple_vcard_3.0', 'manual', etc.
  source_uid TEXT,
  import_kind TEXT, -- 'vcf_upload', 'invitation_update', etc.
  raw_vcf_ref TEXT, -- Reference to stored .vcf file
  imported_at TIMESTAMPTZ,
  transformer_version TEXT,
  confidence_score DECIMAL(3,2) -- 0.00 to 1.00
);
```

**Edge Function Required:**
- `send-invitation-email` - Send invitation with secure token
- `verify-invitation-token` - Validate and return invitation data
- `process-invitation-acceptance` - Merge updates with precedence

---

### 5. **Merge Engine & Conflict Resolution** ⚠️ COMPLEX BUT FEASIBLE

**Proposed Merge Precedence:**
```
self-asserted (1.0) > 
direct-invite update (0.95) > 
first-party import (0.8) > 
third-party import (0.7)
```

**Implementation Approach:**
```typescript
// src/utils/mergeEngine.ts
interface MergeCandidate {
  value: any;
  confidence: number;
  source: 'self' | 'invite' | 'import_first' | 'import_third';
  timestamp: Date;
  provenance: ProvenanceMetadata;
}

function mergeField(candidates: MergeCandidate[]): MergeResult {
  // 1. Sort by confidence DESC, then timestamp DESC
  // 2. Pick highest confidence value
  // 3. Record conflicts in provenance.conflicts[]
  // 4. Flag equal-confidence conflicts for UI review
}
```

**UI Component Needed:**
- Conflict resolution dialog showing side-by-side comparison
- Provenance metadata display (source, confidence, timestamp)
- Manual selection option for tied values

**Question:** Should conflict resolution be:
- **Automatic** (for MVP): Use precedence rules, log conflicts
- **Manual** (Phase 2): Show UI for user review of conflicts

**Recommendation:** Start with automatic + conflict logging, add manual UI in Phase 2.

---

### 6. **Data Retention & PII Governance** ✅ FEASIBLE

**Proposed Policy (from document):**
- Raw .vcf files: 30 days retention
- Normalized cards: User-controlled deletion
- Audit logs: 2 years
- Consent receipts: Permanent (with right-to-erasure provisions)

**Implementation in Supabase:**

```sql
-- Storage bucket for raw .vcf files
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('vcf-imports', 'vcf-imports', false, 5242880); -- 5MB limit

-- Retention policy table (already exists: data_retention_policies)
INSERT INTO data_retention_policies (
  data_type, 
  retention_period_days, 
  auto_delete, 
  archive_first,
  legal_basis
) VALUES (
  'vcf_raw_import', 30, true, true, 'Data minimization principle'
);

-- Scheduled edge function to purge expired artifacts
-- Runs daily via Supabase cron
```

**Key Features:**
- SHA-256 fingerprints retained after purge for dedupe history
- Right-to-erasure: Hard delete with minimal audit marker
- Consent receipts exportable as tamper-evident JSON/PDF

---

### 7. **Export to vCard 3.0 (Round-Trip)** ✅ FEASIBLE

**Export Pipeline:**
```typescript
// src/utils/vcard/exporter.ts
function exportToVCard30(person: Person, cards: Card[]): string {
  // 1. Generate VERSION:3.0 wrapper
  // 2. Map identity cards to FN, N
  // 3. Map phones to TEL + TYPE/PREF
  // 4. Map addresses to ADR + X-ABADR extensions
  // 5. Map relationships to X-ABRELATEDNAMES
  // 6. Include UID for round-trip dedupe
  
  return vCardString;
}
```

**Apple Extension Handling:**
- Custom labels → `itemN.X-ABLabel`
- Relationships → `X-ABRELATEDNAMES`
- Anniversary → `X-ABDATE + X-ABLabel:Anniversary`
- Address details → `X-ABADR`, `X-APPLE-SUBLOCALITY`

**Testing Required:**
- Import Apple vCard → Export → Re-import to Apple Contacts
- Verify all custom labels, relationships, dates preserved
- Validate no data loss on round-trip

---

## Architecture Recommendations

### Option A: **Hybrid Approach** (RECOMMENDED)

**Leverage Existing System + Add vCard Layer**

```
Current Templates ←→ vCard Import/Export Layer ←→ External Systems
     ↓                        ↓
Template-Based Cards    Typed Card Objects
     ↓                        ↓
  Sharing System ←→ Policy Engine ←→ Field-Level Controls
```

**Pros:**
- Preserves existing functionality
- Gradual migration path
- Lower risk
- Users can use both template and vCard workflows

**Cons:**
- Dual data models to maintain
- More complex codebase initially

---

### Option B: **Full Migration to Typed CARDs**

**Replace Template System with Typed CARD Architecture**

```
vCard Import → Typed CARDs → Policy Engine → Sharing → Export
```

**Pros:**
- Cleaner architecture long-term
- Better alignment with vCard standards
- Simplified codebase eventually

**Cons:**
- High migration effort
- Breaking changes for existing users
- Higher implementation risk
- Longer timeline (12-16 weeks vs 8-10 weeks)

---

## Suggested Implementation Plan (Phased)

### **Phase 1: Foundation** (Weeks 1-4)

**Goal:** vCard import → Template-based cards (backward compatible)

1. **Database Schema Extensions**
   - Add `provenance` JSONB to `user_cards`
   - Create `card_invitations` table
   - Create `card_provenance` tracking table
   - Add vCard storage bucket

2. **vCard Import Pipeline**
   - vCard 3.0 parser
   - Apple adapter (X-... extensions)
   - E.164 phone normalizer
   - Email/address validators
   - Mapper to existing template structure

3. **Basic Invitation Flow**
   - Edge function: `send-card-invitation`
   - Invitation token generation
   - Email delivery with secure link
   - Basic landing page for invitees

**Deliverable:** Users can upload .vcf → Creates template-based cards with provenance

---

### **Phase 2: Invitation & Verification** (Weeks 5-7)

**Goal:** Complete invitation flow with OTP verification

1. **Verification System**
   - Email OTP flow
   - Phone OTP flow (optional)
   - Invitation acceptance UI
   - Field editing with validation

2. **Merge Engine (Basic)**
   - Confidence scoring
   - Automatic merge with precedence rules
   - Conflict logging (no UI yet)

3. **Consent & Sharing**
   - Share contract creation
   - Card-level sharing (existing system)
   - Consent receipt generation

**Deliverable:** End-to-end invitation flow working

---

### **Phase 3: Field-Level Policies** (Weeks 8-10)

**Goal:** Granular field-level control

1. **Policy Engine**
   - `field_policies` JSONB column
   - Runtime policy evaluation
   - Filtered view generation
   - Agent policy support (AI delegation)

2. **Enhanced UI**
   - Field-level sharing toggles
   - DOB granularity (month/day vs year)
   - Conflict resolution UI
   - Provenance viewer

3. **vCard Export**
   - Export to vCard 3.0
   - Apple extension preservation
   - Round-trip testing
   - Validation suite

**Deliverable:** Full feature parity with proposed design

---

### **Phase 4: Advanced Features** (Weeks 11-14)

**Goal:** Production hardening & advanced capabilities

1. **Deduplication & Entity Resolution**
   - Fuzzy matching (name + org)
   - Merge UI for duplicates
   - UID-based dedupe

2. **PII Governance**
   - Retention policy automation
   - Purge jobs (daily cron)
   - DLP scanning
   - Audit trail viewer

3. **Quality & Scale**
   - Bulk import UI (CSV + vCard)
   - Batch processing
   - Performance optimization
   - vCard 4.0 support (toggle)

**Deliverable:** Production-ready system

---

## Technical Risks & Mitigations

### Risk 1: **Apple vCard Parsing Complexity** 🟡 MEDIUM

**Issue:** Apple uses non-standard X-... extensions and itemN. groupings

**Mitigation:**
- Use comprehensive test suite with real Apple exports
- Build adapter pattern for each Apple extension
- Document known quirks and workarounds
- Provide "import preview" UI showing parse results

---

### Risk 2: **Address Parsing Accuracy** 🟡 MEDIUM

**Issue:** Splitting "123 Main St Apt 5" into granular components is error-prone

**Mitigation:**
- Use libpostal or Google Maps API for address parsing
- Show parsed components to user for verification
- Allow manual override/correction
- Store both raw and parsed versions

---

### Risk 3: **Merge Conflict Complexity** 🟡 MEDIUM

**Issue:** Determining "correct" value when multiple sources conflict

**Mitigation:**
- Start with simple automatic precedence rules
- Log all conflicts for analysis
- Build conflict UI for manual resolution (Phase 2)
- Allow users to set preferred source per field

---

### Risk 4: **Phone Number Normalization Edge Cases** 🟢 LOW

**Issue:** E.164 requires country code, but vCards may omit

**Mitigation:**
- Use X-ABADR country code when available
- Fall back to address country
- Allow user to select country during import
- Store both raw and E.164 versions

---

### Risk 5: **Performance with Large Imports** 🟡 MEDIUM

**Issue:** Importing 1000+ contact vCard file may timeout

**Mitigation:**
- Implement async processing with job queue
- Use edge function with extended timeout
- Show progress indicator
- Batch database inserts (100 at a time)

---

## Critical Questions for Decision

### 1. **Schema Evolution Path**

**Question:** Do we extend the existing template-based schema or migrate to typed CARDs?

**Options:**
- **A:** Hybrid (extend existing) ← **RECOMMENDED for MVP**
- **B:** Full migration to typed CARDs (better long-term, higher risk)

**Decision needed:** Which approach aligns with product vision and timeline?

---

### 2. **Granularity Storage Model**

**Question:** How do we store DOB to enable year vs month/day sharing?

**Options:**
- **A:** Structured object: `{ year: 2017, month: 9, day: 15 }`
- **B:** Multiple template fields: `dob_year`, `dob_month`, `dob_day`
- **C:** Single field + runtime policy splitting

**Recommendation:** Option A (structured object) for true granularity

**Decision needed:** Confirm approach for DOB, addresses, phones, emails

---

### 3. **Invitation Token Security**

**Question:** What security model for invitation tokens?

**Proposed:**
- HMAC-signed tokens with 7-day expiry
- Single-use tokens (invalidated on acceptance)
- Rate limiting (max 5 attempts per token)
- HTTPS only, no token in URL params (use POST body)

**Decision needed:** Approve security model or suggest changes?

---

### 4. **Conflict Resolution UX**

**Question:** When multiple imports have conflicting data, what's the UX?

**Options:**
- **A:** Auto-merge with notification of conflicts (MVP)
- **B:** Show merge UI requiring user selection
- **C:** Accept all changes, keep historical versions

**Recommendation:** Option A for MVP, Option B for Phase 2

**Decision needed:** Confirm approach?

---

### 5. **AI Agent Delegation**

**Question:** Should we implement agent policies in MVP or defer?

**Document Proposes:**
```json
{
  "agent_id": "agent:route-planner",
  "allowed_paths": ["addressCARD.data.city", "phoneCARD.data.e164"],
  "purpose": "trip_coordinator",
  "expires_at": "2026-01-01T00:00:00Z"
}
```

**Options:**
- **A:** Implement in MVP (adds complexity)
- **B:** Defer to Phase 3 (focus on human sharing first)

**Recommendation:** Option B (defer AI agents)

**Decision needed:** Confirm priority?

---

## Open Questions

1. **Sample vCard Files:** Can you provide actual .vcf exports from Apple, Outlook, Google for testing?

2. **Existing Card Migration:** Should existing template-based cards be auto-migrated to include provenance metadata?

3. **Consent Receipt Format:** PDF, JSON, or both for consent receipts?

4. **International Support:** Should E.164 normalization support all countries or start with US/CA/UK?

5. **Bulk Import Limits:** What's max vCard file size and contact count (suggest 5MB / 1000 contacts)?

6. **Custom vCard Fields:** Should we preserve unknown vCard properties in a `custom_fields` JSONB?

7. **Privacy Default:** When invitee creates account via invitation, what's default sharing scope (one-to-one or private)?

---

## Recommended Next Steps

### Before Development Starts:

1. ✅ **Review this analysis** - Confirm feasibility assessment
2. ⏳ **Make key decisions** - Answer critical questions above
3. ⏳ **Provide test data** - Share sample .vcf files from Apple/Outlook/Google
4. ⏳ **Prioritize features** - Confirm which phases align with timeline
5. ⏳ **Approve schema approach** - Hybrid vs full migration

### Once Approved:

1. Create detailed database migration SQL
2. Build vCard parser with test suite
3. Implement invitation flow (backend first)
4. Create invitation UI mockups for review
5. Develop merge engine logic

---

## Conclusion

**This is a well-architected proposal that is technically feasible.** The vCard 3.0 integration will significantly improve user onboarding and interoperability with existing contact systems.

**Key Success Factors:**
- Start with hybrid approach (extend existing system)
- Focus on vCard 3.0 + Apple first
- Implement field-level policies in Phase 2 (not MVP)
- Robust testing with real-world .vcf files
- User-friendly conflict resolution

**Timeline:** 10-14 weeks for full implementation (phased approach)

**Risk Level:** Medium (manageable with proper planning and testing)

**Recommendation:** **Proceed with Phase 1 implementation** after confirming key architectural decisions outlined above.

---

**Questions or concerns about any aspect of this analysis? Please raise them before proceeding with implementation.**
