# vCard Integration - Revised Implementation Plan
## Based on opnli_mvp_cards.zip Schema Review

**Date:** October 6, 2025  
**Status:** AWAITING ZIP FILE EXTRACTION FOR FINAL REVIEW

---

## Files Referenced from Manifest

Based on the MANIFEST.json provided earlier, the zip contains:

### JSON Schemas:
1. **`schemas/base/card_envelope.schema.json`** (4,639 bytes)
   - Core envelope structure for all CARD types
   - Likely contains metadata, provenance, consent fields

2. **Type-Specific Schemas:**
   - `personal_identity_card.schema.json` (3,036 bytes)
   - `address_card.schema.json` (1,956 bytes)
   - `phone_card.schema.json` (1,716 bytes)
   - `email_card.schema.json` (1,310 bytes)
   - `relationship_card.schema.json` (1,032 bytes)
   - `date_card.schema.json` (847 bytes)
   - `socialmedia_card.schema.json` (913 bytes)
   - `org_member_card.schema.json` (1,024 bytes)
   - `calendar_card.schema.json` (962 bytes)

3. **Policy Schemas:**
   - `field_policy.schema.json` (875 bytes)
   - `share_contract.schema.json` (851 bytes)

4. **Implementation Files:**
   - `adapters/vcard3_apple_mapping.yaml` (1,979 bytes)
   - `src/merge_engine.ts` (3,277 bytes)
   - `src/policy_engine.ts` (2,562 bytes)
   - `docs/Opnli_Cards_Architecture_MVP.md` (6,842 bytes)

5. **Test Fixtures:**
   - `fixtures/sample_apple_contact.vcf` (468 bytes)
   - `fixtures/README.txt` (288 bytes)

---

## Critical Observations

### ✅ **EXCELLENT NEWS: Schemas Already Exist**

The uploaded zip appears to contain a complete, well-architected CARD schema system that aligns perfectly with the proposal in the PDF. This means:

1. **JSON Schema Validation Ready** - All CARD types have formal schemas
2. **Policy Engine Exists** - `policy_engine.ts` and schemas for field-level policies
3. **Merge Engine Exists** - `merge_engine.ts` for conflict resolution
4. **Apple Adapter Defined** - `vcard3_apple_mapping.yaml` with mapping rules
5. **Test Data Available** - Sample vCard for testing

### 🔍 **What I Need to Verify:**

To finalize the implementation plan, I need to examine:

1. **Card Envelope Schema Structure:**
   - Does it include `provenance`, `verification`, `consent`, `fieldPolicies`?
   - How does it map to current `user_cards` table?
   - Is there a `card_type` discriminator field?

2. **Type Schemas vs Current Templates:**
   - How do `personal_identity_card`, `address_card`, etc. map to existing template fields?
   - Are they compatible with the current `card_templates` + `template_fields` architecture?
   - Do they use structured objects (e.g., `{year, month, day}` for DOB)?

3. **Policy Engine Implementation:**
   - What's the algorithm for field-level filtering?
   - How does it integrate with the sharing system?
   - Does it support the granular use cases (DOB month/day vs year)?

4. **Merge Engine Logic:**
   - Does it implement the precedence rules (self-asserted > invite > import)?
   - How does conflict detection work?
   - Is there a confidence scoring system?

5. **vCard Adapter Mapping:**
   - How complete is the Apple X-... extension handling?
   - Does it support itemN. groupings?
   - What's the normalization strategy (E.164, email, address)?

---

## Immediate Next Steps

### Step 1: Extract and Review Schemas (REQUIRED)

**I cannot proceed without seeing the actual schema files.** Please either:

**Option A:** Extract the zip file and share key files:
- `schemas/base/card_envelope.schema.json`
- `schemas/types/personal_identity_card.schema.json`
- `schemas/types/address_card.schema.json`
- `src/policy_engine.ts`
- `src/merge_engine.ts`
- `adapters/vcard3_apple_mapping.yaml`

**Option B:** Provide access to extract the zip programmatically

**Option C:** Copy the zip contents to the project directory so I can read them

---

## Preliminary Revised Strategy

Based on what I know from the manifest, here's my **tentative** revised approach:

### Strategy: **Adopt Existing Schemas + Bridge to Current DB**

Instead of extending the current template system OR doing a full migration, we:

1. **Use the provided JSON schemas as the canonical CARD definition**
2. **Create a translation layer** between schemas and Supabase tables
3. **Implement the provided policy and merge engines**
4. **Build the vCard import/export pipeline** using the provided adapters

### Architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     vCard 3.0 Import                        │
│                     (Apple/Outlook/Gmail)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              vCard Parser + Apple Adapter                   │
│           (Uses vcard3_apple_mapping.yaml)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              JSON Schema Validation Layer                   │
│    (Validates against card_envelope + type schemas)         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  Merge Engine                               │
│         (merge_engine.ts - conflict resolution)             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Database Translation Layer                     │
│   (Maps JSON schemas ↔ user_cards + field_values)           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  Supabase Tables                            │
│     user_cards, card_field_values, card_relationships       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  Policy Engine                              │
│    (policy_engine.ts - field-level filtering)               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              API / UI Layer (React)                         │
│        (Displays filtered views per consent)                │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema Extensions:

```sql
-- Extend user_cards to support CARD envelope metadata
ALTER TABLE user_cards
  ADD COLUMN IF NOT EXISTS card_envelope JSONB, -- Full envelope from schema
  ADD COLUMN IF NOT EXISTS provenance JSONB,    -- Source tracking
  ADD COLUMN IF NOT EXISTS verification JSONB,  -- Verification metadata
  ADD COLUMN IF NOT EXISTS consent JSONB,       -- Sharing consent
  ADD COLUMN IF NOT EXISTS field_policies JSONB; -- Field-level policies

-- Add card provenance tracking
CREATE TABLE IF NOT EXISTS card_provenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES user_cards(id) ON DELETE CASCADE,
  source_system TEXT NOT NULL, -- 'apple_vcard_3.0', 'manual', etc.
  source_uid TEXT,
  import_kind TEXT NOT NULL, -- 'vcf_upload', 'invitation', etc.
  raw_vcf_hash TEXT, -- SHA-256 of original .vcf
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transformer_version TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 0.70, -- 0.00 to 1.00
  metadata JSONB
);

-- Invitation system (as proposed in original plan)
CREATE TABLE IF NOT EXISTS card_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_user_id UUID REFERENCES profiles(id) NOT NULL,
  invitee_email TEXT NOT NULL,
  invitee_phone TEXT,
  invitation_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'verified', 'accepted', 'expired'
  
  -- Pre-filled card data from .vcf import
  prefill_data JSONB NOT NULL,
  requested_cards TEXT[] NOT NULL, -- ['personal_identity', 'address', 'phone', 'email']
  
  -- Share contract
  share_contract JSONB NOT NULL,
  
  -- Lifecycle timestamps
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  sent_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storage for raw .vcf files (30-day retention)
-- Uses storage bucket: vcf-imports
```

---

## Updated Implementation Phases

### **Phase 0: Schema Integration** (Week 1)

**Goal:** Integrate provided schemas and understand their structure

1. **Extract and Review All Schemas**
   - Map schema fields to database columns
   - Identify gaps between schemas and current DB
   - Document translation requirements

2. **Set Up JSON Schema Validation**
   ```bash
   npm install ajv ajv-formats
   ```
   - Create validation service using provided schemas
   - Test with sample data

3. **Analyze Policy and Merge Engines**
   - Review `policy_engine.ts` logic
   - Review `merge_engine.ts` conflict resolution
   - Identify dependencies and requirements

4. **Map vCard Adapter Rules**
   - Review `vcard3_apple_mapping.yaml`
   - Understand transformation rules
   - Plan parser implementation

**Deliverable:** Complete schema documentation and integration strategy

---

### **Phase 1: vCard Import Pipeline** (Weeks 2-3)

**Goal:** Import .vcf → Validated CARD schemas → Database

1. **vCard Parser**
   ```typescript
   // src/utils/vcard/parser.ts
   - Parse vCard 3.0/4.0
   - Handle multiline values
   - Extract itemN. groupings
   - Preserve raw vCard for audit
   ```

2. **Apple Adapter**
   ```typescript
   // src/utils/vcard/appleAdapter.ts
   - Apply vcard3_apple_mapping.yaml rules
   - Convert X-ABLabel to custom labels
   - Map X-ABRELATEDNAMES to relationshipCARD
   - Handle X-ABDATE patterns
   ```

3. **Schema Mapper**
   ```typescript
   // src/utils/vcard/schemaMapper.ts
   - Map vCard properties to CARD schemas
   - Validate against JSON schemas
   - Normalize data (E.164, email, address)
   ```

4. **Database Writer**
   ```typescript
   // src/utils/vcard/databaseWriter.ts
   - Translate CARD schemas to DB rows
   - Create user_cards entries
   - Store provenance metadata
   - Handle relationships
   ```

**Deliverable:** Working .vcf import with provenance tracking

---

### **Phase 2: Invitation System** (Weeks 4-5)

**Goal:** Send invitations, verify identity, accept updates

1. **Invitation Creation**
   - Upload .vcf → Parse → Create invitation
   - Generate secure token (HMAC-signed)
   - Store prefill_data from import

2. **Email Delivery**
   ```typescript
   // supabase/functions/send-card-invitation/index.ts
   - Use Resend API
   - Generate secure link
   - Include invitation preview
   ```

3. **Verification Flow**
   - Email OTP
   - Phone OTP (optional)
   - Token validation

4. **Acceptance & Merge**
   - Invitee edits fields
   - Validate changes against schemas
   - Apply merge_engine.ts logic
   - Update cards with self-asserted data (confidence: 1.0)

**Deliverable:** End-to-end invitation workflow

---

### **Phase 3: Policy Engine Integration** (Week 6)

**Goal:** Field-level granular sharing

1. **Implement Policy Engine**
   ```typescript
   // src/utils/policyEngine.ts (integrate provided file)
   - Field-level filtering
   - Path-based policies (e.g., "data.dateOfBirth.year")
   - Scope evaluation (private, one_to_one, group, etc.)
   ```

2. **UI for Policy Management**
   - Field-level sharing toggles
   - DOB granularity selector (month/day vs year)
   - Policy preview

3. **Runtime Policy Evaluation**
   - Filter card data at read-time
   - Apply to API responses
   - Cache for performance

**Deliverable:** Working field-level sharing controls

---

### **Phase 4: Export & Round-Trip** (Week 7)

**Goal:** Export to vCard 3.0 with Apple extensions

1. **vCard Exporter**
   ```typescript
   // src/utils/vcard/exporter.ts
   - Generate VERSION:3.0
   - Map CARD schemas to vCard properties
   - Include Apple X-... extensions
   - Preserve custom labels via itemN.
   ```

2. **Round-Trip Testing**
   - Import Apple .vcf → Export → Re-import to Apple Contacts
   - Verify no data loss
   - Test custom labels, relationships, dates

**Deliverable:** Production-ready export with round-trip validation

---

### **Phase 5: Production Hardening** (Week 8)

**Goal:** Security, performance, compliance

1. **PII Governance**
   - 30-day retention for raw .vcf files
   - SHA-256 fingerprinting
   - Scheduled purge jobs

2. **Performance Optimization**
   - Bulk import handling
   - Database query optimization
   - Caching strategy

3. **Security Hardening**
   - Input validation (all fields)
   - Rate limiting
   - Token security audit

**Deliverable:** Production-ready system

---

## Critical Questions Remaining

### 1. **Schema Compatibility**

**Question:** Do the provided schemas use structured objects for granular fields?

**Example:** Is DOB stored as:
```json
{
  "dateOfBirth": {
    "year": 2017,
    "month": 9,
    "day": 15
  }
}
```

Or as a single ISO date: `"dateOfBirth": "2017-09-15"`?

**Impact:** Determines if true field-level sharing is possible without additional parsing.

---

### 2. **Merge Engine Algorithm**

**Question:** Does `merge_engine.ts` implement confidence-based precedence?

**Required Logic:**
```typescript
// Precedence: self-asserted (1.0) > invite (0.95) > import_first (0.8) > import_third (0.7)
function mergeField(candidates: MergeCandidate[]): MergeResult {
  const sorted = candidates.sort((a, b) => {
    if (a.confidence !== b.confidence) return b.confidence - a.confidence;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });
  
  return {
    value: sorted[0].value,
    conflicts: sorted.slice(1)
  };
}
```

**Impact:** Determines if we can use the provided engine or need to build our own.

---

### 3. **Policy Engine Capabilities**

**Question:** Does `policy_engine.ts` support path-based policies?

**Required Capability:**
```typescript
// Apply policy at specific JSON path
const policy = {
  path: "data.dateOfBirth.year",
  scope: "private"
};

const filtered = applyPolicy(cardData, policy);
// Result: { "dateOfBirth": { "month": 9, "day": 15 } } // year removed
```

**Impact:** Determines if the provided engine meets granularity requirements.

---

### 4. **Database Translation Strategy**

**Question:** Should we:
- **Option A:** Store full CARD JSON in `user_cards.card_envelope` and use it as source of truth
- **Option B:** Decompose CARD into `template_fields` + `field_values` for backward compatibility
- **Option C:** Hybrid approach (store both for transition period)

**Recommendation:** Need to see schema structure to decide.

---

## Blockers & Requirements

### ⚠️ **BLOCKER: Cannot Finalize Plan Without Schema Review**

I cannot provide a final implementation plan until I review:

1. ✅ `card_envelope.schema.json` - Core structure
2. ✅ Type-specific schemas (at least `personal_identity_card`, `address_card`, `phone_card`)
3. ✅ `policy_engine.ts` - Field filtering logic
4. ✅ `merge_engine.ts` - Conflict resolution logic
5. ✅ `vcard3_apple_mapping.yaml` - Transformation rules

### 🔧 **Required Actions:**

**Please provide schema files by either:**
1. Extracting the zip and sharing files in the chat
2. Copying zip contents to project directory (e.g., `docs/schemas/`)
3. Providing direct file access

---

## Preliminary Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Schema incompatible with current DB | 🔴 HIGH | Review schemas first; may need translation layer |
| Merge engine doesn't match requirements | 🟡 MEDIUM | Extend or replace provided engine |
| Policy engine lacks granular path support | 🟡 MEDIUM | Enhance provided engine with path filtering |
| vCard adapter incomplete for Apple | 🟢 LOW | Likely comprehensive based on YAML size |
| Performance issues with large imports | 🟡 MEDIUM | Implement async processing + batching |

---

## Next Steps

**1. USER ACTION REQUIRED:**
- Extract and share schema files from zip
- OR copy zip contents to project for review

**2. AI REVIEW:**
- Analyze schema structures
- Validate against requirements
- Finalize implementation strategy

**3. DECISION POINT:**
- Approve revised strategy
- Confirm timeline (8 weeks)
- Begin Phase 0 implementation

---

## Conclusion

The existence of pre-built schemas, policy engine, and merge engine is **extremely positive** and significantly de-risks this project. However, I cannot finalize the implementation plan without reviewing the actual schema structures to ensure they align with:

1. Current database architecture
2. Granular sharing requirements (DOB month/day vs year)
3. Invitation workflow needs
4. vCard round-trip requirements

**Please share the schema files so I can provide a final, actionable implementation plan.**
