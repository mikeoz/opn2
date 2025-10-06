# vCard Integration - Batch 2 Analysis: Policy & Merge Engines

## Executive Summary

Batch 2 reveals **production-ready engines** for policy-based access control and intelligent card merging. These engines are **significantly more sophisticated** than our current implementation and provide the foundation for the vCard invitation system.

---

## 1. Policy Engine Analysis

### What It Does
The `policy_engine.ts` implements **field-level access control** that filters card data based on audience context.

### Core Concepts

#### Scope Hierarchy (Privacy Levels)
```
private → one_to_one → group → community → public
                                        ↓
                                     agent (special)
```

- **private**: Owner only
- **one_to_one**: Specific recipient(s)
- **group**: Shared with named groups
- **community**: All authenticated community members
- **public**: Anyone
- **agent**: AI/automation systems

#### Field Policy Structure
```typescript
{
  path: "data.dateOfBirth.year",     // Granular field path
  scope: "community",                 // Who can see it
  recipients: ["user:abc", "group:parentClass2025"],
  purpose: "school_registration",    // Why it's shared
  expires_at: "2025-12-31T23:59:59Z" // Time-limited
}
```

#### Consent Block (Card-Level Default)
```typescript
{
  default_scope: "private",          // Default for all fields
  recipients: ["group:family"],      // Default recipients
  expires_at: "2026-01-01"           // Card-level expiration
}
```

### Key Algorithm
```
1. Check card-level default_scope
2. If default disallows viewer → clear ALL data
3. Apply field-level overrides (can be more OR less restrictive)
4. Unset any fields that don't pass scope check
```

---

## 2. Merge Engine Analysis

### What It Does
Resolves conflicts when multiple cards exist for the same person/field by choosing the "best" value deterministically.

### Precedence Hierarchy
```
1. self_asserted    (User's own input - highest trust)
2. invite_update    (Direct from data owner via invitation)
3. first_party      (Imported from authoritative source)
4. third_party      (Imported from non-authoritative source)
```

### Merge Decision Logic
```
FOR each conflict:
  1. Compare confidence (0.0 - 1.0)
     → Higher confidence wins
  
  2. If tied, compare precedence
     → Higher precedence wins
  
  3. If tied, compare recency (updated_at)
     → More recent wins
  
  4. If still tied → FLAG as manual_conflict
```

### Provenance Tracking
```typescript
{
  source_system: "apple_contacts",
  source_uid: "CNContact:123",
  import_kind: "vcf_bulk_import",
  raw_ref: "s3://bucket/import_123.vcf",
  imported_at: "2025-01-15T10:30:00Z",
  transformer_version: "1.2.0",
  precedence: "third_party"
}
```

### Field-Level Merging
After choosing the winning card, the engine **copies missing fields** from losers:
```
Winner has: {firstName, lastName}
Loser has:  {firstName, lastName, middleName, birthDate}

Result: Winner gets middleName and birthDate copied over
```

---

## 3. Gap Analysis: Current DB vs. Required Schema

| Feature | Current Implementation | Required for vCard |
|---------|----------------------|-------------------|
| **Sharing Control** | Card-level `permissions` JSONB | **Field-level** `fieldPolicies` array |
| **Scope Model** | Generic permissions object | **6-level scope** hierarchy |
| **Recipients** | `shared_with_user_id` (1:1 only) | **Recipients array** (users, groups, agents) |
| **Purpose Tracking** | ❌ None | ✅ `purpose` field |
| **Time-Limited Sharing** | `expires_at` (card-level) | ✅ Per-field `expires_at` |
| **Provenance** | ❌ None | ✅ Full source tracking |
| **Confidence/Quality** | ❌ None | ✅ Confidence + normalized flag |
| **Merge Logic** | ❌ None | ✅ Deterministic conflict resolution |
| **Audit Trail** | `created_at`, `updated_at` | ✅ + `version` number |

---

## 4. Database Schema Extensions Required

### Extend `user_cards` Table

```sql
ALTER TABLE public.user_cards ADD COLUMN IF NOT EXISTS
  -- Card Envelope Fields
  person_id UUID,  -- Links multiple cards to same person
  card_type TEXT,  -- "personal_identity", "phone_card", etc.
  
  -- Provenance (JSONB)
  provenance JSONB DEFAULT '{
    "source_system": "opnli_manual",
    "imported_at": null,
    "precedence": "self_asserted"
  }'::jsonb,
  
  -- Quality Metadata (JSONB)
  quality JSONB DEFAULT '{
    "confidence": 1.0,
    "normalized": true
  }'::jsonb,
  
  -- Consent & Policies (JSONB)
  consent JSONB DEFAULT '{
    "default_scope": "private"
  }'::jsonb,
  
  field_policies JSONB DEFAULT '[]'::jsonb,
  
  -- Versioning
  version INTEGER DEFAULT 1;
```

### New Table: `card_merge_conflicts`

```sql
CREATE TABLE public.card_merge_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL,
  field_path TEXT NOT NULL,
  candidate_cards UUID[] NOT NULL,  -- Array of card IDs
  resolution_status TEXT DEFAULT 'pending',
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_choice UUID,  -- Chosen card_id
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. Integration Strategy

### Phase 1: Schema Migration (Week 1)
1. ✅ Copy policy/merge engines to `src/utils/vcard/`
2. Extend `user_cards` with envelope fields
3. Create `card_merge_conflicts` table
4. Add indexes on `person_id`, `card_type`

### Phase 2: Policy Engine Integration (Week 2)
1. Create `src/hooks/useCardPolicies.ts`
2. Implement `filterCardForAudience()` wrapper
3. Update `CardRelationships` component to support field policies
4. Add UI for setting field-level sharing rules

### Phase 3: Import Pipeline with Provenance (Week 3)
1. vCard parser → envelope converter
2. Set `precedence: "third_party"` for imports
3. Set `precedence: "invite_update"` for invitation-sourced cards
4. Track `source_system`, `imported_at`, `raw_ref`

### Phase 4: Merge Engine Integration (Week 4)
1. Detect duplicate cards by `person_id` + `card_type`
2. Run `mergeSameType()` on conflicts
3. Store conflicts in `card_merge_conflicts`
4. Build manual conflict resolution UI

### Phase 5: Invitation System (Week 5-6)
1. Generate invitation tokens
2. Send emails with vCard attachment
3. On acceptance, create card with `precedence: "invite_update"`
4. Run merge if recipient already has cards
5. Apply field policies from inviter

---

## 6. Critical Observations

### ✅ Strengths
1. **Production-ready code** - No placeholders, complete implementations
2. **Deterministic** - Same inputs always produce same outputs
3. **Auditable** - Full provenance tracking
4. **Privacy-first** - Default is private, explicit opt-in
5. **Time-aware** - Built-in expiration support

### ⚠️ Considerations
1. **Migration complexity** - Need to retrofit existing cards with provenance
2. **Performance** - Field-level filtering requires recursive object traversal
3. **UI complexity** - Users need to understand scope hierarchy
4. **Conflict UI** - Manual resolution requires careful UX design

### 🚨 Security Implications
1. **Scope enforcement** - Must be server-side (RLS policies)
2. **Recipient validation** - Prevent spoofed recipient IDs
3. **Agent scope** - Requires separate authentication for AI systems
4. **Audit trail** - All policy changes must be logged

---

## 7. Recommended Next Steps

### Immediate Actions
1. **Request Batch 3** to see:
   - `vcard3_apple_mapping.yaml` (field mappings)
   - `sample_apple_contact.vcf` (test data)
   - `Opnli_Cards_Architecture_MVP.md` (overall design)

2. **Validate assumptions**:
   - Should we migrate existing cards to envelope format?
   - Do we need manual conflict resolution UI immediately?
   - What's the default scope for legacy cards?

3. **Plan schema migration**:
   - Backward compatibility strategy
   - Data migration script for existing cards
   - RLS policies for new columns

### Before Implementation
- [ ] Confirm `person_id` concept (vs. linking directly to user_id)
- [ ] Decide on scope labels for UI ("Community" vs "Organization"?)
- [ ] Define initial set of field paths for policies
- [ ] Design conflict resolution UX flow

---

## 8. Questions for Batch 3

1. How does `vcard3_apple_mapping.yaml` map vCard fields to card_type schemas?
2. What does a real Apple contact look like in `sample_apple_contact.vcf`?
3. Does `Opnli_Cards_Architecture_MVP.md` show the full system architecture?
4. Are there any other card types beyond the 9 schemas we saw in Batch 1?

---

**Status**: Ready for Batch 3 upload and final implementation planning.
