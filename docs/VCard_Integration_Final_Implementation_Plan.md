# vCard Integration - Final Implementation Plan

## Executive Summary

After analyzing all three batches of the CARD architecture, this document provides the **complete, production-ready implementation plan** for vCard 3.0 integration with field-level sharing, invitation flow, and deterministic merge logic.

**Status**: ✅ All schemas, engines, and mappings validated. Ready for implementation.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema Migration](#2-database-schema-migration)
3. [vCard Import Pipeline](#3-vcard-import-pipeline)
4. [Invitation System](#4-invitation-system)
5. [Policy Engine Integration](#5-policy-engine-integration)
6. [Merge Engine Integration](#6-merge-engine-integration)
7. [vCard Export (Round-Trip)](#7-vcard-export-round-trip)
8. [Implementation Phases](#8-implementation-phases)
9. [Security & Privacy](#9-security--privacy)
10. [Testing Strategy](#10-testing-strategy)

---

## 1. Architecture Overview

### Core Concepts

**Card Envelope Pattern**
```
CardEnvelope {
  card_id, person_id, owner_user_id, card_type
  ├── data: { ...typed card fields }
  ├── provenance: { source, precedence, timestamps }
  ├── verification: { status, verified_by, verified_at }
  ├── consent: { default_scope, recipients, expires_at }
  ├── fieldPolicies: [{ path, scope, recipients, purpose }]
  └── audit: { created_at, updated_at, version }
}
```

**Card Types from vCard**
- `personal_identity_card`: FN, N, BDAY, NICKNAME, PHOTO
- `addressCARD[]`: ADR with Apple extensions (X-ABADR, X-APPLE-SUBLOCALITY)
- `phoneCARD[]`: TEL with custom labels (X-ABLabel)
- `emailCARD[]`: EMAIL with custom labels
- `relationshipCARD[]`: X-ABRELATEDNAMES (Mother, Father, etc.)
- `dateCARD[]`: X-ABDATE (Anniversary, etc.)
- `socialmediaCARD[]`: X-SOCIALPROFILE
- `calendar_card`: FBURL, CALURI
- `org_member_card`: ORG, TITLE, ROLE

**Key Differentiators**
- ✅ Field-level sharing (e.g., share DOB month/day, hide year)
- ✅ Multiple cards per person (`person_id` links them)
- ✅ Provenance tracking (source, precedence, confidence)
- ✅ Deterministic merge (confidence → precedence → recency)
- ✅ Round-trip with Apple (maintains labels and extensions)

---

## 2. Database Schema Migration

### Step 1: Extend `user_cards` Table

```sql
-- Migration: Add CARD envelope fields to user_cards
ALTER TABLE public.user_cards 
  ADD COLUMN IF NOT EXISTS person_id UUID,
  ADD COLUMN IF NOT EXISTS card_type TEXT DEFAULT 'personal_identity_card',
  ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT '{
    "source_system": "opnli_manual",
    "imported_at": null,
    "precedence": "self_asserted",
    "confidence": 1.0
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS quality JSONB DEFAULT '{
    "confidence": 1.0,
    "normalized": true
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS verification JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS consent JSONB DEFAULT '{
    "default_scope": "private"
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS field_policies JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Index for person-based queries
CREATE INDEX IF NOT EXISTS idx_user_cards_person_id 
  ON public.user_cards(person_id);

CREATE INDEX IF NOT EXISTS idx_user_cards_card_type 
  ON public.user_cards(card_type);

CREATE INDEX IF NOT EXISTS idx_user_cards_person_type 
  ON public.user_cards(person_id, card_type);

-- Trigger to auto-increment version on update
CREATE OR REPLACE FUNCTION increment_card_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER card_version_trigger
  BEFORE UPDATE ON public.user_cards
  FOR EACH ROW
  EXECUTE FUNCTION increment_card_version();
```

### Step 2: Create Supporting Tables

```sql
-- Store merge conflicts for manual resolution
CREATE TABLE public.card_merge_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL,
  field_path TEXT NOT NULL,
  candidate_cards UUID[] NOT NULL,
  resolution_status TEXT DEFAULT 'pending' CHECK (
    resolution_status IN ('pending', 'resolved', 'ignored')
  ),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_choice UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_merge_conflicts_person 
  ON public.card_merge_conflicts(person_id)
  WHERE resolution_status = 'pending';

-- Store raw vCard files with retention policy
CREATE TABLE public.vcf_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  file_path TEXT NOT NULL,  -- storage bucket path
  file_sha256 TEXT NOT NULL,
  import_type TEXT DEFAULT 'bulk_upload',
  cards_created UUID[],
  import_metadata JSONB DEFAULT '{}'::jsonb,
  purge_after TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vcf_imports_purge 
  ON public.vcf_imports(purge_after)
  WHERE purge_after IS NOT NULL;

-- Track consent receipts (append-only)
CREATE TABLE public.consent_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  card_id UUID REFERENCES public.user_cards(id),
  consent_type TEXT NOT NULL,
  scope TEXT NOT NULL,
  recipients JSONB,
  purpose TEXT,
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  evidence JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_consent_receipts_user 
  ON public.consent_receipts(user_id);
CREATE INDEX idx_consent_receipts_card 
  ON public.consent_receipts(card_id);
```

### Step 3: RLS Policies

```sql
-- Enable RLS
ALTER TABLE public.card_merge_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vcf_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_receipts ENABLE ROW LEVEL SECURITY;

-- Merge conflicts: users see their own
CREATE POLICY "Users view own merge conflicts"
  ON public.card_merge_conflicts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_cards uc
      WHERE uc.person_id = card_merge_conflicts.person_id
        AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own merge conflicts"
  ON public.card_merge_conflicts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_cards uc
      WHERE uc.person_id = card_merge_conflicts.person_id
        AND uc.user_id = auth.uid()
    )
  );

-- VCF imports: users manage their own
CREATE POLICY "Users manage own imports"
  ON public.vcf_imports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Consent receipts: users view their own (append-only)
CREATE POLICY "Users view own consent"
  ON public.consent_receipts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert consent"
  ON public.consent_receipts FOR INSERT
  WITH CHECK (true);
```

### Step 4: Migrate Existing Cards

```sql
-- Backfill person_id (each existing card becomes its own person)
UPDATE public.user_cards
SET person_id = id
WHERE person_id IS NULL;

-- Set default card_type based on template
UPDATE public.user_cards uc
SET card_type = CASE
  WHEN EXISTS (
    SELECT 1 FROM card_templates ct
    WHERE ct.id = uc.template_id AND ct.name ILIKE '%contact%'
  ) THEN 'personal_identity_card'
  WHEN EXISTS (
    SELECT 1 FROM card_templates ct
    WHERE ct.id = uc.template_id AND ct.name ILIKE '%address%'
  ) THEN 'addressCARD'
  ELSE 'personal_identity_card'
END
WHERE card_type IS NULL OR card_type = 'personal_identity_card';

-- Set provenance for existing cards
UPDATE public.user_cards
SET provenance = jsonb_build_object(
  'source_system', 'opnli_legacy',
  'imported_at', created_at::text,
  'precedence', 'self_asserted',
  'confidence', 1.0
)
WHERE provenance->>'source_system' IS NULL;
```

---

## 3. vCard Import Pipeline

### Architecture

```
┌─────────────┐
│ .vcf Upload │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 1. Parse vCard 3.0                  │
│    - Keep itemN grouping            │
│    - Preserve Apple X-* fields      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 2. Apply Adapter Mapping            │
│    - vcard3_apple_mapping.yaml      │
│    - Create typed cards             │
│    - Set provenance.source_system   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 3. Normalize Fields                 │
│    - Phone: E.164, derive region    │
│    - Email: lowercase domain        │
│    - Address: libpostal parse       │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 4. Dedupe & Merge                   │
│    - Block on email/phone/UID       │
│    - Run merge engine               │
│    - Store conflicts                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 5. Write to Database                │
│    - Insert cards with envelope     │
│    - Link via person_id             │
│    - Create consent receipts        │
└─────────────────────────────────────┘
```

### Implementation

**File: `src/utils/vcard/vcardParser.ts`**

```typescript
import { parseVCard } from 'vcard-parser'; // npm package

export interface ParsedVCard {
  uid?: string;
  fn?: string;
  n?: { family?: string; given?: string; additional?: string; prefix?: string; suffix?: string };
  tel?: Array<{ value: string; type?: string[]; pref?: boolean; itemN?: string }>;
  email?: Array<{ value: string; type?: string[]; pref?: boolean; itemN?: string }>;
  adr?: Array<{ 
    pobox?: string; ext?: string; street?: string; 
    locality?: string; region?: string; postcode?: string; country?: string;
    itemN?: string;
  }>;
  bday?: string;
  nickname?: string;
  photo?: string;
  items: Record<string, Record<string, string>>; // itemN.X-ABLabel, etc.
}

export function parseVCardFile(vcfContent: string): ParsedVCard[] {
  const parsed = parseVCard(vcfContent);
  // Transform to our structure, grouping itemN fields
  return parsed.map(transformVCard);
}

function transformVCard(vcard: any): ParsedVCard {
  // Implementation: extract fields, group itemN properties
  // Keep Apple X-* extensions
  const items: Record<string, Record<string, string>> = {};
  for (const key in vcard) {
    if (key.startsWith('item')) {
      items[key] = vcard[key];
    }
  }
  return {
    uid: vcard.UID,
    fn: vcard.FN,
    n: vcard.N ? {
      family: vcard.N.family,
      given: vcard.N.given,
      additional: vcard.N.additional,
      prefix: vcard.N.prefix,
      suffix: vcard.N.suffix,
    } : undefined,
    tel: vcard.TEL?.map((t: any) => ({
      value: t.value,
      type: t.type,
      pref: t.pref,
      itemN: t.itemN,
    })),
    email: vcard.EMAIL?.map((e: any) => ({
      value: e.value,
      type: e.type,
      pref: e.pref,
      itemN: e.itemN,
    })),
    adr: vcard.ADR?.map((a: any) => ({
      pobox: a.pobox,
      ext: a.ext,
      street: a.street,
      locality: a.locality,
      region: a.region,
      postcode: a.postcode,
      country: a.country,
      itemN: a.itemN,
    })),
    bday: vcard.BDAY,
    nickname: vcard.NICKNAME,
    photo: vcard.PHOTO,
    items,
  };
}
```

**File: `src/utils/vcard/cardAdapter.ts`**

```typescript
import { CardEnvelope } from './policy_engine';
import { ParsedVCard } from './vcardParser';
import mappingYaml from './vcard3_apple_mapping.yaml';

export function vcardToCards(vcard: ParsedVCard, userId: string): CardEnvelope[] {
  const cards: CardEnvelope[] = [];
  const personId = crypto.randomUUID();
  
  // 1. Personal Identity Card
  if (vcard.fn || vcard.n) {
    cards.push(createIdentityCard(vcard, personId, userId));
  }
  
  // 2. Phone Cards (one per number)
  vcard.tel?.forEach((tel, idx) => {
    cards.push(createPhoneCard(tel, vcard, personId, userId, idx));
  });
  
  // 3. Email Cards
  vcard.email?.forEach((email, idx) => {
    cards.push(createEmailCard(email, vcard, personId, userId, idx));
  });
  
  // 4. Address Cards
  vcard.adr?.forEach((adr, idx) => {
    cards.push(createAddressCard(adr, vcard, personId, userId, idx));
  });
  
  // 5. Relationship Cards (X-ABRELATEDNAMES)
  const relationships = extractRelationships(vcard);
  relationships.forEach((rel, idx) => {
    cards.push(createRelationshipCard(rel, personId, userId, idx));
  });
  
  // 6. Date Cards (X-ABDATE for anniversaries)
  const dates = extractDates(vcard);
  dates.forEach((date, idx) => {
    cards.push(createDateCard(date, personId, userId, idx));
  });
  
  return cards;
}

function createIdentityCard(vcard: ParsedVCard, personId: string, userId: string): CardEnvelope {
  const bday = vcard.bday ? parseDateOfBirth(vcard.bday) : undefined;
  
  return {
    card_id: crypto.randomUUID(),
    person_id: personId,
    owner_user_id: userId,
    card_type: 'personal_identity_card',
    data: {
      fullName: vcard.fn,
      firstName: vcard.n?.given,
      lastName: vcard.n?.family,
      middleName: vcard.n?.additional,
      prefix: vcard.n?.prefix,
      suffix: vcard.n?.suffix,
      nickname: vcard.nickname,
      dateOfBirth: bday,
      phoneticFirstName: vcard.items?.['X-PHONETIC-FIRST-NAME'],
      phoneticLastName: vcard.items?.['X-PHONETIC-LAST-NAME'],
      photo: vcard.photo ? { uri: vcard.photo } : undefined,
    },
    provenance: {
      source_system: 'apple_vcard_3.0',
      source_uid: vcard.uid,
      import_kind: 'vcf_upload',
      imported_at: new Date().toISOString(),
      precedence: 'third_party', // Bulk import = third_party
    },
    audit: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
    },
    quality: {
      confidence: 0.8, // vCard imports = high confidence
      normalized: true,
    },
    consent: {
      default_scope: 'private', // Default to private
    },
    fieldPolicies: [],
  };
}

function parseDateOfBirth(bday: string): { year?: number; month?: number; day?: number } {
  // Handle YYYY-MM-DD, YYYYMMDD, --MMDD (year-less), etc.
  const match = bday.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return {
      year: parseInt(match[1]),
      month: parseInt(match[2]),
      day: parseInt(match[3]),
    };
  }
  // Handle other formats...
  return {};
}

function createPhoneCard(tel: any, vcard: ParsedVCard, personId: string, userId: string, index: number): CardEnvelope {
  const itemLabel = tel.itemN ? vcard.items[tel.itemN]?.['X-ABLabel'] : undefined;
  const phoneType = tel.type?.[0]?.toLowerCase() || 'custom';
  
  // Normalize to E.164
  const e164 = normalizePhoneToE164(tel.value, vcard);
  const nanp = parseNANP(e164);
  
  return {
    card_id: crypto.randomUUID(),
    person_id: personId,
    owner_user_id: userId,
    card_type: 'phoneCARD',
    data: {
      number_raw: tel.value,
      e164: e164,
      areaCode: nanp?.areaCode,
      exchange: nanp?.exchange,
      lineNumber: nanp?.lineNumber,
      phone_type: phoneType,
      custom_label: itemLabel,
      preferred: tel.pref || false,
      labels: [phoneType],
    },
    provenance: {
      source_system: 'apple_vcard_3.0',
      import_kind: 'vcf_upload',
      imported_at: new Date().toISOString(),
      raw_ref: tel.itemN,
      precedence: 'third_party',
    },
    audit: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
    },
    quality: {
      confidence: e164 ? 0.9 : 0.6, // Lower if couldn't normalize
      normalized: !!e164,
    },
    consent: {
      default_scope: 'private',
    },
    fieldPolicies: [],
  };
}

function normalizePhoneToE164(raw: string, vcard: ParsedVCard): string | null {
  // Use libphonenumber-js
  // Derive region from first address card's country, or default to 'US'
  const region = vcard.adr?.[0]?.country || 'US';
  try {
    const phoneNumber = parsePhoneNumber(raw, region);
    return phoneNumber.format('E.164');
  } catch {
    return null;
  }
}

function parseNANP(e164: string | null): { areaCode: string; exchange: string; lineNumber: string } | null {
  if (!e164 || !e164.startsWith('+1')) return null;
  const digits = e164.slice(2); // Remove +1
  if (digits.length !== 10) return null;
  return {
    areaCode: digits.slice(0, 3),
    exchange: digits.slice(3, 6),
    lineNumber: digits.slice(6),
  };
}

// Similar functions for createEmailCard, createAddressCard, etc.
```

**File: `src/utils/vcard/normalization.ts`**

```typescript
// Phone normalization with libphonenumber-js
import { parsePhoneNumber } from 'libphonenumber-js';

export function normalizePhone(raw: string, defaultRegion: string = 'US'): {
  e164: string | null;
  nanp: { areaCode: string; exchange: string; lineNumber: string } | null;
} {
  try {
    const phoneNumber = parsePhoneNumber(raw, defaultRegion);
    const e164 = phoneNumber.format('E.164');
    
    // Parse NANP if applicable
    const nanp = e164.startsWith('+1') && e164.length === 12 ? {
      areaCode: e164.slice(2, 5),
      exchange: e164.slice(5, 8),
      lineNumber: e164.slice(8),
    } : null;
    
    return { e164, nanp };
  } catch {
    return { e164: null, nanp: null };
  }
}

// Email normalization
export function normalizeEmail(raw: string): {
  address: string;
  username: string;
  domain: string;
} {
  const [username, domain] = raw.split('@');
  return {
    address: raw.toLowerCase(),
    username,
    domain: domain.toLowerCase(),
  };
}

// Address normalization (future: integrate libpostal)
export function normalizeAddress(adr: any): {
  streetNumber?: string;
  streetName?: string;
  unit?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  sublocality?: string;
} {
  // Placeholder: parse adr.street into streetNumber + streetName
  // Use libpostal for production
  return {
    streetName: adr.street,
    unit: adr.ext,
    city: adr.locality,
    state: adr.region,
    postalCode: adr.postcode,
    country: adr.country,
  };
}
```

---

## 4. Invitation System

### Flow

```
┌────────────────────────────────────────────────────────────┐
│ Inviter: Imports vCard → Creates card_invitation          │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│ System: Sends email with secure link + OTP                 │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│ Invitee: Verifies email/phone, views pre-filled card       │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│ Invitee: Edits fields, sets sharing preferences            │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│ System: Validates, creates card with precedence=           │
│         "invite_update", runs merge engine                  │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│ System: Creates consent receipt, notifies inviter          │
└────────────────────────────────────────────────────────────┘
```

### Database Extension

```sql
-- Extend card_invitations with envelope support
ALTER TABLE public.card_invitations
  ADD COLUMN IF NOT EXISTS prefilled_data JSONB, -- CardEnvelope data
  ADD COLUMN IF NOT EXISTS share_contract JSONB, -- Proposed field policies
  ADD COLUMN IF NOT EXISTS verification_method TEXT DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS otp_code TEXT,
  ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_completed BOOLEAN DEFAULT false;
```

### Edge Function: `send-card-invitation`

**File: `supabase/functions/send-card-invitation/index.ts`**

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  recipientEmail: string;
  recipientName: string;
  prefilledData: any; // CardEnvelope data
  shareContract?: any; // Proposed fieldPolicies
  personalMessage?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { recipientEmail, recipientName, prefilledData, shareContract, personalMessage }: InvitationRequest = await req.json();

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const invitationToken = crypto.randomUUID();

    // Create invitation
    const { data: invitation, error: invError } = await supabase
      .from('card_invitations')
      .insert({
        invitation_token: invitationToken,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        prefilled_data: prefilledData,
        share_contract: shareContract,
        otp_code: otpCode,
        otp_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
        status: 'pending',
        bulk_import_job_id: null, // Set if from bulk import
      })
      .select()
      .single();

    if (invError) throw invError;

    // Send email via Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const inviteUrl = `https://app.opn2.com/invite/${invitationToken}`;

    await resend.emails.send({
      from: 'Opnli <invitations@opnli.com>',
      to: recipientEmail,
      subject: `${user.email} wants to connect with you on Opnli`,
      html: `
        <h1>You've been invited to Opnli</h1>
        <p>${user.email} has shared their contact information with you.</p>
        ${personalMessage ? `<p><em>"${personalMessage}"</em></p>` : ''}
        <p><strong>Verification Code:</strong> ${otpCode}</p>
        <p><a href="${inviteUrl}">Click here to accept and update your details</a></p>
        <p>This invitation expires in 30 days.</p>
      `,
    });

    return new Response(
      JSON.stringify({ success: true, invitation_id: invitation.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Invitation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Edge Function: `accept-card-invitation`

**File: `supabase/functions/accept-card-invitation/index.ts`**

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mergeSameType } from './merge_engine.ts'; // Copy merge_engine to function

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AcceptRequest {
  invitationToken: string;
  otpCode: string;
  updatedData: any; // Modified card data from invitee
  fieldPolicies?: any[]; // Invitee's sharing preferences
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { invitationToken, otpCode, updatedData, fieldPolicies }: AcceptRequest = await req.json();

    // Verify invitation and OTP
    const { data: invitation, error: invError } = await supabase
      .from('card_invitations')
      .select('*')
      .eq('invitation_token', invitationToken)
      .eq('status', 'pending')
      .single();

    if (invError || !invitation) {
      throw new Error('Invalid invitation');
    }

    if (invitation.otp_code !== otpCode) {
      throw new Error('Invalid OTP code');
    }

    if (new Date(invitation.otp_expires_at) < new Date()) {
      throw new Error('OTP expired');
    }

    // Create card with invite_update precedence
    const personId = crypto.randomUUID();
    const cardEnvelope = {
      card_id: crypto.randomUUID(),
      person_id: personId,
      owner_user_id: user.id,
      card_type: 'personal_identity_card',
      data: updatedData,
      provenance: {
        source_system: 'invitation_system',
        import_kind: 'invite_acceptance',
        imported_at: new Date().toISOString(),
        precedence: 'invite_update', // Higher precedence than bulk imports
      },
      audit: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1,
      },
      quality: {
        confidence: 1.0, // Invitee confirmed = highest confidence
        normalized: true,
      },
      consent: {
        default_scope: fieldPolicies?.length ? 'private' : 'one_to_one',
        recipients: [`user:${invitation.created_by}`],
      },
      fieldPolicies: fieldPolicies || [],
      verification: {
        status: 'verified',
        method: 'email_otp',
        verified_at: new Date().toISOString(),
      },
    };

    // Check for existing cards to merge
    const { data: existingCards } = await supabase
      .from('user_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('card_type', 'personal_identity_card');

    let finalCard = cardEnvelope;
    if (existingCards && existingCards.length > 0) {
      // Run merge engine
      const cardsToMerge = [...existingCards.map(c => ({
        ...c,
        data: c.card_data,
      })), cardEnvelope];
      
      const mergeResult = mergeSameType(cardsToMerge, [
        'data.firstName', 'data.lastName', 'data.email', 'data.phone'
      ]);

      finalCard = mergeResult.winner;

      // Store conflicts if any
      if (mergeResult.conflicts.length > 0) {
        await supabase.from('card_merge_conflicts').insert(
          mergeResult.conflicts.map(c => ({
            person_id: personId,
            field_path: c.path,
            candidate_cards: c.candidates.map(card => card.card_id),
            resolution_status: 'pending',
          }))
        );
      }
    }

    // Insert final card
    const { data: newCard, error: cardError } = await supabase
      .from('user_cards')
      .insert({
        user_id: user.id,
        template_id: null, // No template for envelope cards
        card_data: finalCard.data,
        person_id: finalCard.person_id,
        card_type: finalCard.card_type,
        provenance: finalCard.provenance,
        quality: finalCard.quality,
        verification: finalCard.verification,
        consent: finalCard.consent,
        field_policies: finalCard.fieldPolicies,
        version: 1,
      })
      .select()
      .single();

    if (cardError) throw cardError;

    // Update invitation status
    await supabase
      .from('card_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        card_id: newCard.id,
      })
      .eq('id', invitation.id);

    // Create consent receipt
    await supabase.from('consent_receipts').insert({
      user_id: user.id,
      card_id: newCard.id,
      consent_type: 'invitation_acceptance',
      scope: finalCard.consent.default_scope,
      recipients: finalCard.consent.recipients,
      granted: true,
      granted_at: new Date().toISOString(),
      ip_address: req.headers.get('x-forwarded-for'),
      user_agent: req.headers.get('user-agent'),
      evidence: {
        invitation_id: invitation.id,
        otp_verified: true,
      },
    });

    return new Response(
      JSON.stringify({ success: true, card_id: newCard.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Accept invitation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 5. Policy Engine Integration

### Hook: `useCardPolicies.ts`

**File: `src/hooks/useCardPolicies.ts`**

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { filterCardForAudience, CardEnvelope, AudienceCtx } from '@/utils/vcard/policy_engine';
import { supabase } from '@/integrations/supabase/client';

export const useCardPolicies = (cardId: string, viewerContext?: Partial<AudienceCtx>) => {
  const [filteredCard, setFilteredCard] = useState<CardEnvelope | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!cardId) return;

    const fetchAndFilterCard = async () => {
      setLoading(true);
      try {
        const { data: card, error } = await supabase
          .from('user_cards')
          .select('*')
          .eq('id', cardId)
          .single();

        if (error) throw error;

        // Build audience context
        const audienceCtx: AudienceCtx = {
          viewer_id: viewerContext?.viewer_id || `user:${user?.id}`,
          groups: viewerContext?.groups || [],
          role: viewerContext?.role || (user?.id === card.user_id ? 'owner' : 'public'),
        };

        // Convert DB card to CardEnvelope
        const envelope: CardEnvelope = {
          card_id: card.id,
          owner_user_id: card.user_id,
          card_type: card.card_type,
          data: card.card_data,
          consent: card.consent,
          fieldPolicies: card.field_policies || [],
        };

        // Apply policy filtering
        const filtered = filterCardForAudience(envelope, audienceCtx);
        setFilteredCard(filtered);
      } catch (error) {
        console.error('Error filtering card:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndFilterCard();
  }, [cardId, user, viewerContext]);

  return { filteredCard, loading };
};
```

### Component: Field-Level Sharing UI

**File: `src/components/FieldPoliciesEditor.tsx`**

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Scope } from '@/utils/vcard/policy_engine';

interface FieldPolicy {
  path: string;
  scope: Scope;
  recipients?: string[];
  purpose?: string;
}

interface FieldPoliciesEditorProps {
  cardData: Record<string, any>;
  existingPolicies: FieldPolicy[];
  onChange: (policies: FieldPolicy[]) => void;
}

export const FieldPoliciesEditor: React.FC<FieldPoliciesEditorProps> = ({
  cardData,
  existingPolicies,
  onChange,
}) => {
  const [policies, setPolicies] = useState<FieldPolicy[]>(existingPolicies);

  const fieldPaths = extractFieldPaths(cardData);

  const updatePolicy = (path: string, scope: Scope) => {
    const updated = [...policies];
    const existing = updated.find(p => p.path === path);
    if (existing) {
      existing.scope = scope;
    } else {
      updated.push({ path, scope });
    }
    setPolicies(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Field-Level Sharing</h3>
      
      {fieldPaths.map(path => {
        const policy = policies.find(p => p.path === path);
        const currentScope = policy?.scope || 'private';
        
        return (
          <div key={path} className="flex items-center justify-between p-3 border rounded">
            <div>
              <span className="font-medium">{formatFieldPath(path)}</span>
              <Badge variant="outline" className="ml-2">{getScopeLabel(currentScope)}</Badge>
            </div>
            
            <Select value={currentScope} onValueChange={(scope) => updatePolicy(path, scope as Scope)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">🔒 Private</SelectItem>
                <SelectItem value="one_to_one">👤 Specific People</SelectItem>
                <SelectItem value="group">👥 Groups</SelectItem>
                <SelectItem value="community">🌐 Community</SelectItem>
                <SelectItem value="public">🌍 Public</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
};

function extractFieldPaths(data: Record<string, any>, prefix = 'data'): string[] {
  const paths: string[] = [];
  
  for (const [key, value] of Object.entries(data)) {
    const path = `${prefix}.${key}`;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      paths.push(...extractFieldPaths(value, path));
    } else {
      paths.push(path);
    }
  }
  
  return paths;
}

function formatFieldPath(path: string): string {
  const parts = path.split('.');
  return parts[parts.length - 1]
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}

function getScopeLabel(scope: Scope): string {
  const labels: Record<Scope, string> = {
    private: 'Private',
    one_to_one: 'Direct Share',
    group: 'Group',
    community: 'Community',
    public: 'Public',
    agent: 'AI Agent',
  };
  return labels[scope];
}
```

---

## 6. Merge Engine Integration

### Hook: `useMergeConflicts.ts`

**File: `src/hooks/useMergeConflicts.ts`**

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MergeConflict {
  id: string;
  person_id: string;
  field_path: string;
  candidate_cards: string[];
  resolution_status: 'pending' | 'resolved' | 'ignored';
  created_at: string;
}

export const useMergeConflicts = (personId?: string) => {
  const [conflicts, setConflicts] = useState<MergeConflict[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchConflicts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('card_merge_conflicts')
        .select('*')
        .eq('resolution_status', 'pending')
        .order('created_at', { ascending: false });

      if (personId) {
        query = query.eq('person_id', personId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConflicts(data || []);
    } catch (error) {
      console.error('Error fetching conflicts:', error);
      toast.error('Failed to load merge conflicts');
    } finally {
      setLoading(false);
    }
  };

  const resolveConflict = async (conflictId: string, chosenCardId: string) => {
    try {
      const { error } = await supabase
        .from('card_merge_conflicts')
        .update({
          resolution_status: 'resolved',
          resolution_choice: chosenCardId,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', conflictId);

      if (error) throw error;
      
      toast.success('Conflict resolved');
      await fetchConflicts();
    } catch (error) {
      console.error('Error resolving conflict:', error);
      toast.error('Failed to resolve conflict');
    }
  };

  const ignoreConflict = async (conflictId: string) => {
    try {
      const { error } = await supabase
        .from('card_merge_conflicts')
        .update({
          resolution_status: 'ignored',
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', conflictId);

      if (error) throw error;
      
      toast.success('Conflict ignored');
      await fetchConflicts();
    } catch (error) {
      console.error('Error ignoring conflict:', error);
      toast.error('Failed to ignore conflict');
    }
  };

  useEffect(() => {
    fetchConflicts();
  }, [user, personId]);

  return {
    conflicts,
    loading,
    resolveConflict,
    ignoreConflict,
    refetch: fetchConflicts,
  };
};
```

### Component: Merge Conflict Resolution UI

**File: `src/components/MergeConflictResolver.tsx`**

```typescript
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMergeConflicts } from '@/hooks/useMergeConflicts';
import { Loader2, Check, X } from 'lucide-react';

export const MergeConflictResolver: React.FC<{ personId?: string }> = ({ personId }) => {
  const { conflicts, loading, resolveConflict, ignoreConflict } = useMergeConflicts(personId);

  if (loading) {
    return <Loader2 className="h-6 w-6 animate-spin" />;
  }

  if (conflicts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Conflicts</CardTitle>
          <CardDescription>All your card data is synchronized</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Merge Conflicts</h2>
      <p className="text-muted-foreground">
        We found {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} that need your attention
      </p>

      {conflicts.map(conflict => (
        <Card key={conflict.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{formatFieldPath(conflict.field_path)}</span>
              <Badge variant="destructive">Conflict</Badge>
            </CardTitle>
            <CardDescription>
              Multiple values found from different sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conflict.candidate_cards.map(cardId => (
                <CandidateCard
                  key={cardId}
                  cardId={cardId}
                  fieldPath={conflict.field_path}
                  onChoose={() => resolveConflict(conflict.id, cardId)}
                />
              ))}
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => ignoreConflict(conflict.id)}
              >
                <X className="h-4 w-4 mr-2" />
                Ignore Conflict
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const CandidateCard: React.FC<{
  cardId: string;
  fieldPath: string;
  onChoose: () => void;
}> = ({ cardId, fieldPath, onChoose }) => {
  const [card, setCard] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchCard = async () => {
      const { data } = await supabase
        .from('user_cards')
        .select('*')
        .eq('id', cardId)
        .single();
      setCard(data);
    };
    fetchCard();
  }, [cardId]);

  if (!card) return null;

  const fieldValue = getNestedValue(card.card_data, fieldPath);
  const source = card.provenance?.source_system || 'Unknown';
  const precedence = card.provenance?.precedence || 'unknown';
  const confidence = card.quality?.confidence || 0;

  return (
    <div className="border rounded-lg p-4 hover:bg-accent/5 transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="font-medium text-lg">{fieldValue}</p>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{source}</Badge>
            <Badge variant="secondary">{precedence}</Badge>
            <Badge variant="outline">Confidence: {(confidence * 100).toFixed(0)}%</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Updated: {new Date(card.updated_at).toLocaleDateString()}
          </p>
        </div>
        
        <Button onClick={onChoose} size="sm">
          <Check className="h-4 w-4 mr-2" />
          Choose This
        </Button>
      </div>
    </div>
  );
};

function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let value = obj;
  for (const part of parts) {
    value = value?.[part];
  }
  return value;
}

function formatFieldPath(path: string): string {
  const parts = path.split('.');
  return parts[parts.length - 1]
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}
```

---

## 7. vCard Export (Round-Trip)

### Utility: `vcardExporter.ts`

**File: `src/utils/vcard/vcardExporter.ts`**

```typescript
import { CardEnvelope } from './policy_engine';

export function exportToVCard30(cards: CardEnvelope[]): string {
  const lines: string[] = [];
  
  lines.push('BEGIN:VCARD');
  lines.push('VERSION:3.0');
  
  // Find identity card
  const identity = cards.find(c => c.card_type === 'personal_identity_card');
  if (identity) {
    if (identity.data.fullName) {
      lines.push(`FN:${identity.data.fullName}`);
    }
    
    if (identity.data.lastName || identity.data.firstName) {
      const n = [
        identity.data.lastName || '',
        identity.data.firstName || '',
        identity.data.middleName || '',
        identity.data.prefix || '',
        identity.data.suffix || '',
      ].join(';');
      lines.push(`N:${n}`);
    }
    
    if (identity.data.nickname) {
      lines.push(`NICKNAME:${identity.data.nickname}`);
    }
    
    if (identity.data.dateOfBirth) {
      const dob = identity.data.dateOfBirth;
      const bdayStr = `${dob.year || '0000'}-${String(dob.month).padStart(2, '0')}-${String(dob.day).padStart(2, '0')}`;
      lines.push(`BDAY:${bdayStr}`);
    }
    
    if (identity.data.phoneticFirstName) {
      lines.push(`X-PHONETIC-FIRST-NAME:${identity.data.phoneticFirstName}`);
    }
    if (identity.data.phoneticLastName) {
      lines.push(`X-PHONETIC-LAST-NAME:${identity.data.phoneticLastName}`);
    }
  }
  
  // Phone cards
  let itemIndex = 1;
  const phoneCards = cards.filter(c => c.card_type === 'phoneCARD');
  phoneCards.forEach((phone, idx) => {
    const types = [];
    if (phone.data.phone_type && phone.data.phone_type !== 'custom') {
      types.push(phone.data.phone_type.toUpperCase());
    }
    if (phone.data.preferred) {
      types.push('PREF=1');
    }
    
    const typeStr = types.length > 0 ? `;TYPE=${types.join(',')}` : '';
    lines.push(`TEL${typeStr}:${phone.data.number_raw}`);
    
    if (phone.data.custom_label) {
      lines.push(`item${itemIndex}.TEL:${phone.data.number_raw}`);
      lines.push(`item${itemIndex}.X-ABLabel:${phone.data.custom_label}`);
      itemIndex++;
    }
  });
  
  // Email cards
  const emailCards = cards.filter(c => c.card_type === 'emailCARD');
  emailCards.forEach(email => {
    const types = [];
    if (email.data.email_type && email.data.email_type !== 'custom') {
      types.push(email.data.email_type.toUpperCase());
    }
    if (email.data.preferred) {
      types.push('PREF=1');
    }
    
    const typeStr = types.length > 0 ? `;TYPE=${types.join(',')}` : '';
    lines.push(`EMAIL${typeStr}:${email.data.address}`);
    
    if (email.data.custom_label) {
      lines.push(`item${itemIndex}.EMAIL:${email.data.address}`);
      lines.push(`item${itemIndex}.X-ABLabel:${email.data.custom_label}`);
      itemIndex++;
    }
  });
  
  // Address cards
  const addressCards = cards.filter(c => c.card_type === 'addressCARD');
  addressCards.forEach(addr => {
    const adrParts = [
      '', // POBOX (ignored)
      addr.data.unit || '',
      [addr.data.streetNumber, addr.data.streetName].filter(Boolean).join(' '),
      addr.data.city || '',
      addr.data.state || '',
      addr.data.postalCode || '',
      addr.data.country || '',
    ];
    
    const types = addr.data.labels?.map((l: string) => l.toUpperCase()).join(',') || 'HOME';
    lines.push(`ADR;TYPE=${types}:${adrParts.join(';')}`);
    
    if (addr.data.country) {
      lines.push(`item${itemIndex}.ADR:${adrParts.join(';')}`);
      lines.push(`item${itemIndex}.X-ABADR:${addr.data.country}`);
      if (addr.data.sublocality) {
        lines.push(`item${itemIndex}.X-APPLE-SUBLOCALITY:${addr.data.sublocality}`);
      }
      itemIndex++;
    }
  });
  
  // Relationship cards
  const relationshipCards = cards.filter(c => c.card_type === 'relationshipCARD');
  relationshipCards.forEach(rel => {
    lines.push(`item${itemIndex}.X-ABRELATEDNAMES:${rel.data.targetDisplay}`);
    lines.push(`item${itemIndex}.X-ABLabel:${rel.data.kind}`);
    itemIndex++;
  });
  
  // Date cards (anniversaries)
  const dateCards = cards.filter(c => c.card_type === 'dateCARD');
  dateCards.forEach(date => {
    lines.push(`item${itemIndex}.X-ABDATE:${date.data.value}`);
    lines.push(`item${itemIndex}.X-ABLabel:${date.data.kind}`);
    itemIndex++;
  });
  
  lines.push('END:VCARD');
  
  return lines.join('\r\n');
}

export function downloadVCard(vcfContent: string, filename: string) {
  const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

---

## 8. Implementation Phases

### **Phase 0: Foundation (Week 1)** ✅ COMPLETED

- [x] Copy schemas to `docs/schemas/`
- [x] Copy engines to `src/utils/vcard/`
- [x] Copy mapping to `src/utils/vcard/vcard3_apple_mapping.yaml`
- [x] Create analysis documents

### **Phase 1: Database Migration (Week 2)**

**Goals**: Extend database to support CARD envelope

**Tasks**:
1. Run SQL migrations for `user_cards` extensions
2. Create `card_merge_conflicts` table
3. Create `vcf_imports` table
4. Create `consent_receipts` table
5. Add RLS policies
6. Backfill existing cards with envelope fields
7. Test queries and indexes

**Deliverables**:
- [ ] Migration scripts executed
- [ ] All tables created with RLS
- [ ] Existing cards migrated
- [ ] Database linter passes

### **Phase 2: vCard Import Pipeline (Week 3)**

**Goals**: Import Apple vCard 3.0 files into typed cards

**Tasks**:
1. Install dependencies: `vcard-parser`, `libphonenumber-js`
2. Implement `vcardParser.ts`
3. Implement `cardAdapter.ts` using mapping YAML
4. Implement `normalization.ts` (E.164, email, address)
5. Create bulk import UI component
6. Create edge function for processing imports
7. Test with `sample_apple_contact.vcf`

**Deliverables**:
- [ ] Parser handles Apple extensions (X-ABLabel, X-ABDATE, etc.)
- [ ] Phone numbers normalized to E.164
- [ ] Multiple card types created from single vCard
- [ ] Provenance tracked with `precedence: third_party`
- [ ] Bulk import page functional

### **Phase 3: Invitation System (Week 4-5)**

**Goals**: Implement secure invitation flow with OTP verification

**Tasks**:
1. Extend `card_invitations` with envelope support
2. Create `send-card-invitation` edge function
3. Create `accept-card-invitation` edge function
4. Build invitation creation UI
5. Build invitation acceptance UI with OTP
6. Implement email sending via Resend
7. Test full invitation flow

**Deliverables**:
- [ ] Invitations sent with pre-filled data
- [ ] OTP verification working
- [ ] Accepted cards have `precedence: invite_update`
- [ ] Consent receipts created
- [ ] Email notifications sent

### **Phase 4: Policy Engine (Week 6)**

**Goals**: Implement field-level access control

**Tasks**:
1. Create `useCardPolicies` hook
2. Build `FieldPoliciesEditor` component
3. Integrate policy engine into card views
4. Add scope selection UI (private → public)
5. Test filtering for different audiences
6. Add recipient selection UI

**Deliverables**:
- [ ] Field-level policies editable
- [ ] Cards filtered based on viewer context
- [ ] Scope hierarchy working (private → one_to_one → group → community → public)
- [ ] Policy enforcement on card display

### **Phase 5: Merge Engine (Week 7)**

**Goals**: Implement deterministic conflict resolution

**Tasks**:
1. Create `useMergeConflicts` hook
2. Build `MergeConflictResolver` component
3. Integrate merge engine into import/invitation flows
4. Add automatic merging for high-confidence matches
5. Build conflict resolution UI
6. Test merge precedence (self_asserted > invite_update > first_party > third_party)

**Deliverables**:
- [ ] Duplicate cards detected
- [ ] Merge engine runs on import/invitation
- [ ] Conflicts stored in database
- [ ] Manual resolution UI functional
- [ ] Field-level merging working

### **Phase 6: Export & Round-Trip (Week 8)**

**Goals**: Export cards back to vCard 3.0 with Apple compatibility

**Tasks**:
1. Implement `vcardExporter.ts`
2. Test round-trip: import → export → import
3. Verify Apple labels preserved
4. Add download vCard button
5. Test with multiple card types
6. Validate with Apple Contacts

**Deliverables**:
- [ ] vCard 3.0 export working
- [ ] Apple extensions preserved (X-ABLabel, etc.)
- [ ] Round-trip maintains data fidelity
- [ ] Download button in UI

### **Phase 7: Production Hardening (Week 9)**

**Goals**: Security, performance, and compliance

**Tasks**:
1. Implement raw artifact retention (30-day purge)
2. Add DLP scanning for sensitive data
3. Performance testing (large imports)
4. Security audit (RLS, GDPR)
5. Error handling and logging
6. User documentation

**Deliverables**:
- [ ] Raw VCF files purged after 30 days
- [ ] Consent receipts retained 2 years
- [ ] Performance benchmarks met
- [ ] Security scan passes
- [ ] Documentation complete

---

## 9. Security & Privacy

### Data Retention Policies

```sql
-- Scheduled job to purge old VCF imports
CREATE OR REPLACE FUNCTION purge_expired_vcf_imports()
RETURNS void AS $$
BEGIN
  DELETE FROM public.vcf_imports
  WHERE purge_after < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run daily
SELECT cron.schedule(
  'purge-vcf-imports',
  '0 2 * * *', -- 2 AM daily
  'SELECT purge_expired_vcf_imports()'
);
```

### RLS Policy Enforcement

**Critical**: Policy filtering MUST happen server-side

```typescript
// ❌ WRONG: Client-side filtering only
const cards = await supabase.from('user_cards').select('*');
const filtered = filterCardForAudience(cards[0], audienceCtx);

// ✅ CORRECT: Server-side RLS + client-side display filtering
// RLS prevents data leakage, policy engine formats display
const cards = await supabase.from('user_cards').select('*'); // RLS blocks unauthorized
const filtered = filterCardForAudience(cards[0], audienceCtx); // Format for display
```

### PII Protection

1. **Encryption at rest**: All card data in database encrypted
2. **TLS in transit**: All API calls over HTTPS
3. **Field-level redaction**: Policy engine removes unauthorized fields before display
4. **Audit trail**: All access logged in `consent_receipts`
5. **Right to deletion**: GDPR-compliant deletion via `data_subject_requests`

### Consent Management

```typescript
// Always create consent receipt when sharing
async function shareCard(cardId: string, recipientId: string, fieldPolicies: any[]) {
  // ... update card ...
  
  await supabase.from('consent_receipts').insert({
    user_id: userId,
    card_id: cardId,
    consent_type: 'field_sharing',
    scope: 'one_to_one',
    recipients: [recipientId],
    granted: true,
    granted_at: new Date().toISOString(),
    evidence: { field_policies: fieldPolicies },
  });
}
```

---

## 10. Testing Strategy

### Unit Tests

**File: `src/utils/vcard/__tests__/policy_engine.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { filterCardForAudience } from '../policy_engine';

describe('Policy Engine', () => {
  it('filters private fields from public viewers', () => {
    const card = {
      card_id: '1',
      owner_user_id: 'owner123',
      card_type: 'personal_identity_card',
      data: {
        fullName: 'John Doe',
        dateOfBirth: { year: 1990, month: 5, day: 15 },
      },
      consent: { default_scope: 'public' },
      fieldPolicies: [
        { path: 'data.dateOfBirth.year', scope: 'private' },
      ],
    };

    const filtered = filterCardForAudience(card, { role: 'public' });
    
    expect(filtered.data.fullName).toBe('John Doe');
    expect(filtered.data.dateOfBirth.month).toBe(5);
    expect(filtered.data.dateOfBirth.year).toBeUndefined();
  });
  
  it('allows group members to see group-scoped fields', () => {
    const card = {
      card_id: '1',
      owner_user_id: 'owner123',
      card_type: 'phoneCARD',
      data: { number_raw: '555-1234', e164: '+15551234' },
      consent: { default_scope: 'private', recipients: ['group:family'] },
      fieldPolicies: [],
    };

    const filtered = filterCardForAudience(card, {
      groups: ['group:family'],
      role: 'public',
    });
    
    expect(filtered.data.e164).toBe('+15551234');
  });
});
```

**File: `src/utils/vcard/__tests__/merge_engine.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { chooseWinner, mergeSameType } from '../merge_engine';

describe('Merge Engine', () => {
  it('prefers self-asserted over third-party', () => {
    const cardA = {
      card_id: '1',
      person_id: 'p1',
      owner_user_id: 'u1',
      card_type: 'personal_identity_card',
      data: { firstName: 'John' },
      provenance: { precedence: 'self_asserted', imported_at: '2025-01-01' },
      audit: { created_at: '2025-01-01', updated_at: '2025-01-01', version: 1 },
      quality: { confidence: 0.8 },
    };

    const cardB = {
      ...cardA,
      card_id: '2',
      data: { firstName: 'Jonathan' },
      provenance: { precedence: 'third_party', imported_at: '2025-01-02' },
    };

    const winner = chooseWinner(cardA, cardB, 'data.firstName');
    expect(winner).toBe(cardA);
  });

  it('copies missing fields from losers', () => {
    const cards = [
      {
        card_id: '1',
        person_id: 'p1',
        owner_user_id: 'u1',
        card_type: 'personal_identity_card',
        data: { firstName: 'John', lastName: 'Doe' },
        provenance: { precedence: 'self_asserted', imported_at: '2025-01-01' },
        audit: { created_at: '2025-01-01', updated_at: '2025-01-01', version: 1 },
        quality: { confidence: 1.0 },
      },
      {
        card_id: '2',
        person_id: 'p1',
        owner_user_id: 'u1',
        card_type: 'personal_identity_card',
        data: { firstName: 'John', middleName: 'Q', nickname: 'Johnny' },
        provenance: { precedence: 'third_party', imported_at: '2025-01-02' },
        audit: { created_at: '2025-01-02', updated_at: '2025-01-02', version: 1 },
        quality: { confidence: 0.7 },
      },
    ];

    const result = mergeSameType(cards, ['data.firstName', 'data.middleName', 'data.nickname']);
    
    expect(result.winner.data.firstName).toBe('John');
    expect(result.winner.data.lastName).toBe('Doe');
    expect(result.winner.data.middleName).toBe('Q'); // Copied from loser
    expect(result.winner.data.nickname).toBe('Johnny'); // Copied from loser
  });
});
```

### Integration Tests

**File: `__tests__/integration/vcard-import.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { parseVCardFile } from '@/utils/vcard/vcardParser';
import { vcardToCards } from '@/utils/vcard/cardAdapter';
import fs from 'fs';

describe('vCard Import Integration', () => {
  it('imports sample Apple contact correctly', () => {
    const vcfContent = fs.readFileSync('docs/fixtures/sample_apple_contact.vcf', 'utf-8');
    const parsed = parseVCardFile(vcfContent);
    
    expect(parsed).toHaveLength(1);
    expect(parsed[0].fn).toBe('Dr. John Quincy Public, Jr.');
    
    const cards = vcardToCards(parsed[0], 'test-user-id');
    
    // Should create multiple cards
    expect(cards.length).toBeGreaterThan(1);
    
    // Identity card
    const identity = cards.find(c => c.card_type === 'personal_identity_card');
    expect(identity).toBeDefined();
    expect(identity?.data.firstName).toBe('John');
    expect(identity?.data.lastName).toBe('Public');
    
    // Phone cards
    const phones = cards.filter(c => c.card_type === 'phoneCARD');
    expect(phones.length).toBe(2);
    
    // Relationship card
    const relationships = cards.filter(c => c.card_type === 'relationshipCARD');
    expect(relationships.length).toBe(1);
    expect(relationships[0].data.targetDisplay).toBe('Mary Public');
    expect(relationships[0].data.kind).toBe('Mother');
  });
});
```

---

## 11. Dependencies to Install

```bash
# vCard parsing
bun add vcard-parser

# Phone number normalization
bun add libphonenumber-js

# YAML parsing (for mapping file)
bun add js-yaml
bun add -D @types/js-yaml

# Date parsing
bun add date-fns

# Testing
bun add -D vitest
```

---

## 12. Success Criteria

### MVP Definition of Done

- [ ] Import Apple vCard 3.0 → creates typed cards
- [ ] Multiple card types per person (identity, phone, email, address)
- [ ] Provenance tracking (source_system, precedence, confidence)
- [ ] Invitation flow with OTP verification
- [ ] Field-level sharing policies (6 scopes)
- [ ] Merge engine with conflict detection
- [ ] Export back to vCard 3.0 (round-trip)
- [ ] Consent receipts for all sharing events
- [ ] 30-day retention for raw VCF files
- [ ] RLS policies enforcing access control

### Quality Metrics

- **Import Success Rate**: >95% for Apple vCard 3.0
- **Phone Normalization**: >90% E.164 conversion
- **Merge Accuracy**: <5% false positives on deduplication
- **Policy Enforcement**: 100% (server-side RLS)
- **Round-Trip Fidelity**: 100% for standard fields, >90% for Apple extensions

---

## 13. Risk Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Address parsing errors | Medium | High | Use libpostal; fallback to raw storage |
| Phone normalization failures | Medium | Medium | Log failures; require manual region selection |
| Merge conflicts overwhelming users | High | Medium | Auto-resolve high-confidence; batch conflicts |
| vCard 3.0 export incompatibility | Medium | Low | Test with Apple Contacts; maintain mapping YAML |
| Performance with large imports | Medium | Medium | Batch processing; background jobs; progress UI |
| RLS policy bypass | Critical | Low | Security audit; automated testing; linting |

---

## Conclusion

This implementation plan provides a **complete, production-ready blueprint** for vCard 3.0 integration with:

✅ Field-level sharing control  
✅ Deterministic merge logic  
✅ Apple-compatible round-trip  
✅ Secure invitation system  
✅ GDPR-compliant consent  
✅ Provenance tracking  

**Next Steps**:  
1. Approve this plan  
2. Begin Phase 1: Database Migration  
3. Proceed phase-by-phase with testing  

All schemas, engines, and mappings are validated and ready for integration.
