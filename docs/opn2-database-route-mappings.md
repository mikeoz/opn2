# Opn2 Database-Route Mappings

**Version:** 1.0  
**Date:** November 8, 2025  
**Companion Document:** [opn2-routing-spec-one-pager_with-snippets.md](./opn2-routing-spec-one-pager_with-snippets.md)

---

## Purpose

This document maps Supabase database tables to UI routes and view states, showing which tables power which screens in the Opn2 application. It serves as the "data layer map" complementing the routing spec's "UI layer map."

---

## 1. Route → Tables Matrix

### `/family-management` Route

**Page Component:** `FamilyManagement` (src/pages/FamilyManagement.tsx)  
**Main Component:** `FamilyManagement` (src/components/FamilyManagement.tsx)

#### View State: General Family Management Dashboard (no family selected)

##### Tab: "Family Tree"

**Hook:** `useFamilyUnits()` (src/hooks/useFamilyUnits.ts)  
**Component:** `FamilyTreeVisualization` (src/components/FamilyTreeVisualization.tsx)

| Table | Operations | Purpose | Key Columns | RLS Policies Applied |
|-------|-----------|---------|-------------|---------------------|
| `family_units` | SELECT | Load all family units visible to user | `id`, `family_label`, `trust_anchor_user_id`, `generation_level`, `is_active` | "Users can view family units they are trust anchor of or members" |
| `profiles` | SELECT | Get trust anchor profile info | `first_name`, `last_name`, `birth_name` | "Users can view their own profile" |
| `organization_memberships` | SELECT | Check user's membership in families | `organization_user_id`, `individual_user_id`, `is_family_unit`, `status`, `relationship_label` | "Users can view their own memberships" |

**Database Functions Called:**
- `get_family_member_count(family_trust_anchor_id)` - Returns count of family members (security definer)

**Real-time Subscriptions:**
- `family_units` table (all events: INSERT, UPDATE, DELETE)
- `organization_memberships` filtered by `individual_user_id=eq.{current_user}`
- `organization_memberships` filtered by `organization_user_id=eq.{current_user}`
- `family_invitations` filtered by `invitee_email=eq.{user_email}` (UPDATE events)

##### Tab: "Generation View"

**Hook:** `useFamilyUnits()` (src/hooks/useFamilyUnits.ts)  
**Component:** `FamilyManagement` (src/components/FamilyManagement.tsx)

| Table | Operations | Purpose | Key Columns | RLS Policies Applied |
|-------|-----------|---------|-------------|---------------------|
| `family_units` | SELECT | Load and group families by generation | Same as Family Tree tab | Same as Family Tree tab |
| `profiles` | SELECT | Display trust anchor names | Same as Family Tree tab | Same as Family Tree tab |
| `organization_memberships` | SELECT | Check ownership and membership | Same as Family Tree tab | Same as Family Tree tab |

##### Tab: "All Members"

**Hook:** `useFamilyMembers()` (src/hooks/useFamilyMembers.ts)  
**Component:** `FamilyMembersView` (src/components/FamilyMembersView.tsx)

| Table | Operations | Purpose | Key Columns | RLS Policies Applied |
|-------|-----------|---------|-------------|---------------------|
| `organization_memberships` | SELECT | Get all active family memberships | `id`, `individual_user_id`, `relationship_label`, `family_generation`, `is_minor`, `joined_at` | "Users can view their own memberships" |
| `profiles` | SELECT (via join) | Get member profile details | `first_name`, `last_name`, `email` | "Users can view their own profile" |
| `pending_family_profiles` | SELECT | Get claimed pending profiles (minors) | `id`, `first_name`, `last_name`, `email`, `relationship_label`, `member_type`, `status` | "Users can view seed profiles they created" |

**Real-time Subscriptions:**
- `organization_memberships` filtered by `organization_user_id=eq.{familyUnitId}`
- `pending_family_profiles` filtered by `family_unit_id=eq.{familyUnitId}`

---

### `/family-management/:familyId` Route

**Page Component:** `FamilyManagement` (src/pages/FamilyManagement.tsx)  
**Main Component:** `FamilyManagement` (src/components/FamilyManagement.tsx)

#### View State: Individual Family Unit Management

##### Tab: "Overview"

**Hook:** `useFamilyUnits()` (src/hooks/useFamilyUnits.ts)  
**Component:** `FamilyManagement` (src/components/FamilyManagement.tsx)

| Table | Operations | Purpose | Key Columns | RLS Policies Applied |
|-------|-----------|---------|-------------|---------------------|
| `family_units` | SELECT | Display selected family details | `id`, `family_label`, `trust_anchor_user_id`, `generation_level`, `parent_family_unit_id`, `created_at`, `family_metadata` | "Users can view family units they are trust anchor of or members" |
| `profiles` | SELECT | Show trust anchor info | `first_name`, `last_name` | "Users can view their own profile" |

##### Tab: "Members"

**Hook:** `useFamilyMembers()` (src/hooks/useFamilyMembers.ts)  
**Component:** `FamilyMemberManager` (src/components/FamilyMemberManager.tsx)

| Table | Operations | Purpose | Key Columns | RLS Policies Applied |
|-------|-----------|---------|-------------|---------------------|
| `organization_memberships` | SELECT, INSERT, UPDATE, DELETE | Manage family memberships | `id`, `individual_user_id`, `organization_user_id`, `relationship_label`, `family_generation`, `is_minor`, `status`, `permissions` | "Users can create memberships for their organization", "Organization admins can update/delete memberships" |
| `profiles` | SELECT (via join) | Display member details | `first_name`, `last_name`, `email` | "Users can view their own profile" |
| `pending_family_profiles` | SELECT, INSERT, UPDATE, DELETE | Manage minor/pending profiles | `id`, `first_name`, `last_name`, `email`, `relationship_label`, `member_type`, `status`, `seed_data` | "Users can create/update/delete seed profiles for their family units" |

**Real-time Subscriptions:**
- `organization_memberships` filtered by `organization_user_id=eq.{familyUnitId}`
- `pending_family_profiles` filtered by `family_unit_id=eq.{familyUnitId}`

##### Tab: "Relationships"

**Hook:** `useRelationshipCards()` (src/hooks/useRelationshipCards.ts)  
**Component:** `RelationshipCardsView` (src/components/RelationshipCardsView.tsx)

| Table | Operations | Purpose | Key Columns | RLS Policies Applied |
|-------|-----------|---------|-------------|---------------------|
| `relationship_cards` | SELECT, INSERT, UPDATE, DELETE | Manage peer-to-peer relationship cards | `id`, `from_user_id`, `to_user_id`, `to_user_email`, `relationship_label_from`, `relationship_label_to`, `status`, `invitation_token`, `reciprocal_card_id` | "Users can create relationship invitations", "Users can view their own relationship cards", "Users can update their relationship cards" |
| `profiles` | SELECT (via join) | Display user names in relationships | `first_name`, `last_name`, `email` | "Users can view their own profile" |

**Real-time Subscriptions:**
- `relationship_cards` filtered by `from_user_id=eq.{user_id}` OR `to_user_id=eq.{user_id}`

##### Tab: "Cards"

**Status:** Placeholder (not yet implemented)  
**Planned Tables:** `user_cards`, `card_field_values`, `card_templates`

##### Tab: "Invites"

**Hook:** `useFamilyInvitations()` (src/hooks/useFamilyInvitations.ts)  
**Component:** `FamilyInvitationsManager` (src/components/FamilyInvitationsManager.tsx)

| Table | Operations | Purpose | Key Columns | RLS Policies Applied |
|-------|-----------|---------|-------------|---------------------|
| `family_invitations` | SELECT, INSERT, UPDATE, DELETE | Manage family join invitations | `id`, `family_unit_id`, `invitee_email`, `invitee_name`, `relationship_role`, `status`, `invitation_token`, `expires_at`, `sent_at` | "Users can create invitations for their family units", "Users can view invitations they created" |

**Edge Functions Called:**
- `email-family-invitation` - Sends invitation email with token

**Real-time Subscriptions:**
- `family_invitations` filtered by `family_unit_id=eq.{familyUnitId}`

##### Tab: "Tree"

**Hook:** `useFamilyUnits()`, `useFamilyMembers()` (src/hooks/)  
**Component:** `FamilyTreeTab` (src/components/FamilyTreeTab.tsx)

| Table | Operations | Purpose | Key Columns | RLS Policies Applied |
|-------|-----------|---------|-------------|---------------------|
| `family_units` | SELECT | Display family tree structure | `id`, `family_label`, `parent_family_unit_id`, `generation_level` | "Users can view family units they are trust anchor of or members" |
| `organization_memberships` | SELECT | Show family members in tree | `individual_user_id`, `relationship_label`, `family_generation` | "Users can view their own memberships" |
| `profiles` | SELECT (via join) | Display names in tree nodes | `first_name`, `last_name` | "Users can view their own profile" |

##### Tab: "Settings"

**Hook:** `useFamilyOwnershipTransfers()` (src/hooks/useFamilyOwnershipTransfers.ts)  
**Component:** `FamilySettings` (src/components/FamilySettings.tsx)

| Table | Operations | Purpose | Key Columns | RLS Policies Applied |
|-------|-----------|---------|-------------|---------------------|
| `family_units` | UPDATE, DELETE | Edit family settings, deactivate family | `family_label`, `family_metadata`, `is_active` | "Trust anchors can manage their family units" |
| `family_ownership_transfers` | SELECT, INSERT, UPDATE | Manage ownership transfer requests | `id`, `family_unit_id`, `current_owner`, `proposed_owner_email`, `status`, `transfer_token`, `expires_at` | "Family owners can initiate transfers", "Proposed owners can respond to transfers" |

**Edge Functions Called:**
- `transfer-family-ownership` - Sends ownership transfer notification email

---

## 2. Table → Routes Reference

### Table: `family_units`

**Purpose:** Core family unit/trust anchor records

**Used By Routes:**
- `/family-management` - All tabs
- `/family-management/:familyId` - All tabs

**Primary Operations:**
- **SELECT:** Load family units user owns or is member of
- **INSERT:** Create new family unit (`createFamilyUnit()`)
- **UPDATE:** Edit family label/metadata (`updateFamilyUnit()`)
- **DELETE:** Soft delete via `is_active=false` (`deactivateFamilyUnit()`)

**Key RLS Policies:**
- "Users can create family units as trust anchor" (INSERT)
- "Trust anchors can manage their family units" (UPDATE/DELETE)
- "Users can view family units they are trust anchor of or members" (SELECT)
- "Family members can view their family units" (SELECT)

**Real-time Enabled:** Yes (all events)

---

### Table: `organization_memberships`

**Purpose:** Links individual users to family units with relationship roles

**Used By Routes:**
- `/family-management` - "All Members" tab, "Generation View" tab
- `/family-management/:familyId` - "Members" tab, "Tree" tab

**Primary Operations:**
- **SELECT:** Get family members and check membership status
- **INSERT:** Add new family member
- **UPDATE:** Modify member permissions or relationship
- **DELETE:** Remove family member

**Key Columns:**
- `organization_user_id` - References trust anchor's user ID
- `individual_user_id` - References family member's user ID
- `is_family_unit` - Must be `true` for family memberships
- `relationship_label` - Role like "spouse", "child", "parent"
- `family_generation` - Generation level relative to trust anchor
- `status` - "active", "invited", "declined"

**Key RLS Policies:**
- "Users can view their own memberships" (SELECT)
- "Users can create memberships for their organization" (INSERT)
- "Organization admins can update memberships" (UPDATE)
- "Organization admins can delete memberships" (DELETE)

**Real-time Enabled:** Yes (all events, filtered by user_id or organization_id)

---

### Table: `pending_family_profiles`

**Purpose:** Placeholder profiles for minors or pending family members without accounts

**Used By Routes:**
- `/family-management` - "All Members" tab
- `/family-management/:familyId` - "Members" tab

**Primary Operations:**
- **SELECT:** Get pending profiles for display
- **INSERT:** Create new minor/pending profile
- **UPDATE:** Modify profile or claim ownership
- **DELETE:** Remove pending profile

**Key Columns:**
- `family_unit_id` - Links to family unit
- `first_name`, `last_name`, `email` - Basic identity
- `relationship_label` - Role like "child", "grandchild"
- `member_type` - "minor", "pending"
- `status` - "pending", "claimed", "transferred"
- `created_by` - User who created this profile
- `claimed_by` - User who claimed this profile (when transferred)
- `invitation_token` - Token for ownership claim

**Key RLS Policies:**
- "Users can create seed profiles for their family units" (INSERT)
- "Users can view seed profiles they created" (SELECT)
- "Users can update seed profiles they created" (UPDATE)
- "Users can claim seed profiles" (UPDATE - for ownership transfer)
- "Users can view seed profiles by invitation token" (SELECT - public for claim)

**Real-time Enabled:** Yes (all events, filtered by family_unit_id)

---

### Table: `profiles`

**Purpose:** User profile information (synced from auth.users)

**Used By Routes:**
- All routes (via joins to get user names)

**Primary Operations:**
- **SELECT:** Get user names, emails, profile info (via joins)
- **UPDATE:** User can update their own profile
- **INSERT:** Auto-created on user registration

**Key Columns:**
- `id` - References auth.users.id
- `first_name`, `last_name`, `birth_name`
- `email` - Synced from auth
- `account_type` - "individual" or "non_individual"
- `guid` - Global unique identifier

**Key RLS Policies:**
- "Users can view their own profile" (SELECT)
- "Users can update their own profile" (UPDATE)

**Real-time Enabled:** No (not typically needed)

---

### Table: `family_invitations`

**Purpose:** Pending invitations to join family units

**Used By Routes:**
- `/family-management/:familyId` - "Invites" tab
- `/register` - Accept invitation during registration

**Primary Operations:**
- **SELECT:** View pending invitations
- **INSERT:** Create new invitation
- **UPDATE:** Change status (sent, accepted, declined, expired)
- **DELETE:** Cancel invitation

**Key Columns:**
- `family_unit_id` - Target family unit
- `invitee_email`, `invitee_name` - Recipient info
- `relationship_role` - Proposed role in family
- `invitation_token` - Unique token for acceptance
- `status` - "pending", "sent", "accepted", "declined", "expired"
- `expires_at` - Expiration timestamp
- `sent_at` - When email was sent
- `invited_by` - User who sent invitation

**Key RLS Policies:**
- "Users can create invitations for their family units" (INSERT)
- "Users can view invitations they created" (SELECT)
- "Family owners can manage invitations" (UPDATE/DELETE)

**Real-time Enabled:** Yes (filtered by family_unit_id or invitee_email)

---

### Table: `relationship_cards`

**Purpose:** Peer-to-peer relationship cards between users

**Used By Routes:**
- `/family-management/:familyId` - "Relationships" tab

**Primary Operations:**
- **SELECT:** View relationship cards
- **INSERT:** Create relationship invitation
- **UPDATE:** Accept/modify relationship, update reciprocal card
- **DELETE:** Remove relationship

**Key Columns:**
- `from_user_id` - User initiating relationship
- `to_user_id` - Target user (null until accepted)
- `to_user_email` - Email for invitation
- `relationship_label_from` - How initiator sees recipient
- `relationship_label_to` - How recipient sees initiator
- `status` - "invited", "accepted", "modified", "declined"
- `invitation_token` - Token for acceptance
- `reciprocal_card_id` - Links to reciprocal card
- `confidence` - Verification metadata
- `network_rules` - Sharing rules
- `shared_attributes` - What data is shared

**Key RLS Policies:**
- "Users can create relationship invitations" (INSERT)
- "Users can view their own relationship cards" (SELECT)
- "Users can update their relationship cards" (UPDATE)
- "Users can delete their own relationship cards" (DELETE)

**Database Triggers:**
- `create_reciprocal_relationship_card()` - Auto-creates reciprocal card on acceptance

**Real-time Enabled:** Yes (filtered by from_user_id or to_user_id)

---

### Table: `family_ownership_transfers`

**Purpose:** Pending ownership transfer requests for family units

**Used By Routes:**
- `/family-management/:familyId` - "Settings" tab

**Primary Operations:**
- **SELECT:** View transfer requests
- **INSERT:** Initiate ownership transfer
- **UPDATE:** Accept/decline transfer

**Key Columns:**
- `family_unit_id` - Family being transferred
- `current_owner` - Current trust anchor
- `proposed_owner_email` - Proposed new owner
- `proposed_owner_id` - Proposed new owner user ID (if registered)
- `transfer_token` - Unique token for acceptance
- `status` - "pending", "accepted", "declined", "expired"
- `expires_at` - Expiration timestamp (default 7 days)
- `message` - Optional message from current owner

**Key RLS Policies:**
- "Family owners can initiate transfers" (INSERT)
- "Current and proposed owners can view transfers" (SELECT)
- "Proposed owners can respond to transfers" (UPDATE)

**Real-time Enabled:** No (email-based flow)

---

## 3. Data Flow Patterns

### Pattern 1: Family Member List Display

**User Action:** Navigate to `/family-management` → "All Members" tab

**Data Flow:**
1. **Component:** `FamilyMembersView` renders
2. **Hook:** `useFamilyMembers(familyUnitId)` initializes
3. **Query 1:** Fetch active memberships
   ```typescript
   supabase.from('organization_memberships')
     .select(`id, individual_user_id, relationship_label, ...
       profiles:individual_user_id(first_name, last_name, email)`)
     .eq('organization_user_id', familyUnitId)
     .eq('is_family_unit', true)
     .eq('status', 'active')
   ```
4. **Query 2:** Fetch claimed pending profiles
   ```typescript
   supabase.from('pending_family_profiles')
     .select('*')
     .eq('family_unit_id', familyUnitId)
     .eq('status', 'claimed')
   ```
5. **Merge:** Combine results into unified `FamilyMember[]` array
6. **Real-time:** Subscribe to both tables for live updates
7. **Display:** Render member list in UI

**Dependencies:** Must have `familyUnitId` from selected family

**Real-time Behavior:** List auto-refreshes when members added/removed

---

### Pattern 2: Family Unit Creation

**User Action:** Click "Create Family Unit" button

**Data Flow:**
1. **Component:** `CreateFamilyUnitDialog` opens
2. **User Input:** Enter family label, optional metadata
3. **Hook:** `useFamilyUnits()` → `createFamilyUnit()`
4. **Insert:**
   ```typescript
   supabase.from('family_units')
     .insert({
       family_label: familyLabel,
       trust_anchor_user_id: user.id,
       parent_family_unit_id: parentFamilyUnitId,
       family_metadata: metadata
     })
   ```
5. **Trigger:** `set_family_generation()` auto-sets generation level
6. **Event:** Dispatch `family-units:refetch` custom event
7. **Real-time:** Broadcast INSERT to subscribed clients
8. **Fallback:** Manual state update after 1s if real-time fails
9. **Update:** Family units list refreshes
10. **Toast:** Show success message

**Dependencies:** Authenticated user required

**Real-time Behavior:** New family appears immediately for all viewers

---

### Pattern 3: Family Invitation Flow

**User Action:** Send family invitation from "Invites" tab

**Data Flow:**
1. **Component:** `FamilyInvitationsManager` → send invitation
2. **Hook:** `useFamilyInvitations()` → `createInvitation()`
3. **Insert:**
   ```typescript
   supabase.from('family_invitations')
     .insert({
       family_unit_id: familyUnitId,
       invitee_email: email,
       invitee_name: name,
       relationship_role: role,
       invited_by: user.id
     })
   ```
4. **Edge Function:** Call `email-family-invitation`
   - Fetch invitation details via `invitation_token`
   - Generate invitation URL
   - Send email via Resend
   - Update `sent_at` timestamp
5. **Real-time:** Broadcast to subscribed clients
6. **Update:** Invitation appears in list with "sent" status

**Acceptance Flow (Separate):**
1. **User:** Click link in email
2. **Route:** Navigate to `/register?invitation={token}`
3. **Component:** Register page fetches invitation by token
4. **Action:** User completes registration
5. **Edge Function:** `accept-family-invitation` called
   - Update invitation status to "accepted"
   - Create `organization_memberships` record
6. **Real-time:** Broadcast membership change
7. **Event:** Dispatch `family-membership-updated` event
8. **Refresh:** Family units and members lists auto-update

**Dependencies:** Requires RESEND_API_KEY secret

**Email Provider:** Resend (via edge function)

---

### Pattern 4: Relationship Card Creation & Acceptance

**User Action:** Create relationship invitation

**Data Flow:**
1. **Component:** `RelationshipInvitationDialog` → create
2. **Hook:** `useRelationshipCards()` → `createRelationship()`
3. **Insert:**
   ```typescript
   supabase.from('relationship_cards')
     .insert({
       from_user_id: user.id,
       to_user_email: email,
       relationship_label_from: 'friend',
       relationship_label_to: 'friend',
       status: 'invited'
     })
   ```
4. **Edge Function:** `send-relationship-invitation` (if implemented)
5. **Real-time:** Broadcast to sender

**Acceptance Flow:**
1. **Recipient:** Navigates via invitation link
2. **Component:** Accept dialog fetches by `invitation_token`
3. **Function:** Call `accept_relationship_invitation(token, modified_label)`
4. **Update:** Change status to "accepted" (or "modified")
5. **Trigger:** `create_reciprocal_relationship_card()` fires
   - Auto-creates reciprocal card
   - Links via `reciprocal_card_id`
6. **Real-time:** Broadcast to both users
7. **Display:** Both users see the relationship

**Dependencies:** Both users must have accounts

**Security:** RLS ensures users only see their own relationships

---

## 4. Database Functions Reference

### `get_family_member_count(family_trust_anchor_id UUID)`

**Purpose:** Count all family members (memberships + pending profiles)

**Returns:** `INTEGER`

**Security:** `SECURITY DEFINER` (bypasses RLS)

**Usage:** Called by `useFamilyUnits` to get accurate member counts

**Query:**
```sql
SELECT (
  (SELECT COUNT(*)::integer FROM organization_memberships
   WHERE organization_user_id = family_trust_anchor_id
     AND is_family_unit = true AND status = 'active')
  +
  (SELECT COUNT(*)::integer FROM pending_family_profiles pfp
   JOIN family_units fu ON fu.id = pfp.family_unit_id
   WHERE fu.trust_anchor_user_id = family_trust_anchor_id
     AND pfp.status = 'claimed')
)::integer
```

---

### `accept_family_invitation_transaction(...)`

**Purpose:** Atomic transaction to accept family invitation

**Parameters:**
- `p_invitation_id UUID`
- `p_user_id UUID`
- `p_trust_anchor_user_id UUID`
- `p_relationship_role TEXT`
- `p_invited_by UUID`

**Returns:** `JSONB` with success/error status

**Security:** `SECURITY DEFINER`

**Operations:**
1. Update invitation status to "accepted"
2. Check for duplicate membership
3. Create `organization_memberships` record
4. Return result JSON

---

### `accept_relationship_invitation(p_invitation_token TEXT, p_modified_label_to TEXT)`

**Purpose:** Accept relationship card invitation

**Parameters:**
- `p_invitation_token TEXT` - Unique invitation token
- `p_modified_label_to TEXT` - Optional modified label

**Returns:** `UUID` (relationship card ID)

**Security:** `SECURITY DEFINER`

**Operations:**
1. Find invitation by token
2. Validate not expired
3. Update status to "accepted" or "modified"
4. Set `to_user_id` to current user
5. Return card ID
6. Trigger creates reciprocal card

---

## 5. Edge Functions Reference

### `email-family-invitation`

**Purpose:** Send family invitation email

**Trigger:** Called when invitation created/resent

**Input:**
```typescript
{
  invitationToken: string;
  origin?: string;
}
```

**Tables Read:**
- `family_invitations` - Get invitation details
- `family_units` - Get family label
- `profiles` - Get sender name

**Tables Updated:**
- `family_invitations` - Set `sent_at` timestamp

**External API:** Resend (email service)

**Email Content:** Invitation link, family info, personal message

---

### `email-profile-claim-invitation`

**Purpose:** Send ownership transfer invitation for minor profile

**Trigger:** Called from "Members" tab → transfer ownership

**Input:**
```typescript
{
  profileId: string;
  inviteeEmail: string;
  inviteeName: string;
  familyUnitId: string;
  invitationToken: string;
}
```

**Tables Read:**
- `pending_family_profiles` - Get profile details
- `family_units` - Get family info

**External API:** Resend (email service)

**Email Content:** Claim link for minor's account

---

### `transfer-family-ownership`

**Purpose:** Send family unit ownership transfer notification

**Trigger:** Called from "Settings" tab → transfer ownership

**Input:**
```typescript
{
  familyUnitId: string;
  proposedOwnerEmail: string;
  message?: string;
}
```

**Tables Read:**
- `family_units` - Verify current owner
- `family_ownership_transfers` - Get transfer token

**External API:** Resend (email service)

**Email Content:** Accept/decline links for ownership transfer

---

## 6. Performance Considerations

### Query Optimization

1. **Family Units Query:**
   - Uses selective indexes on `trust_anchor_user_id`, `is_active`
   - Member count via `SECURITY DEFINER` function avoids RLS overhead
   - Batch queries for enrichment data

2. **Members Query:**
   - Single JOIN to profiles table
   - Filtered by `organization_user_id` + `is_family_unit` (indexed)
   - Separate query for pending profiles (smaller dataset)

3. **Real-time Subscriptions:**
   - Filtered by user-specific criteria to reduce payload
   - Per-instance channel names avoid duplicate subscriptions
   - Debounced refetch to prevent rapid-fire queries

### Caching Strategy

- **Hook-level state:** React Query could cache family units, members
- **Real-time invalidation:** Automatic cache bust on table changes
- **Manual refetch:** Custom events trigger refetch when needed

### Bottlenecks

- **Member count calculation:** `get_family_member_count()` runs for each family unit
  - **Mitigation:** Batch queries, consider denormalized count column
- **Multiple real-time channels:** Each family unit creates subscriptions
  - **Mitigation:** Single channel with filter, cleanup on unmount

---

## 7. Security Model Summary

### RLS Policy Patterns

1. **Ownership Check:** `auth.uid() = trust_anchor_user_id`
2. **Membership Check:** Subquery on `organization_memberships`
3. **Email Match:** `profiles.email = table.email_column`
4. **Security Definer Functions:** Bypass RLS for aggregate queries

### Token-Based Access

- **Invitation Tokens:** Allow public read of specific records
- **Transfer Tokens:** Enable ownership claim flows
- **Expiration:** All tokens have `expires_at` timestamp

### Admin Overrides

- **Admin Role:** Uses `has_role()` function for elevated access
- **Audit Logging:** All admin actions logged to `audit_logs`

---

## 8. Migration & Schema Evolution

### Adding New View State

1. Identify required tables and columns
2. Check existing RLS policies
3. Add new policies if needed (via migration tool)
4. Create/update hook to fetch data
5. Update this document with new mapping
6. Test with multiple user roles

### Modifying Table Structure

1. Use migration tool (NOT direct SQL)
2. Update affected hooks to use new columns
3. Update this document
4. Test real-time subscriptions still work
5. Verify RLS policies still apply correctly

---

## 9. Troubleshooting

### Issue: Infinite Loop on Data Fetch

**Symptom:** Component re-renders continuously

**Cause:** Hook dependency array includes non-memoized function

**Solution:** Wrap functions in `useCallback` with empty deps array

**Example:**
```typescript
// ❌ WRONG - causes infinite loop
const fetchData = async () => { ... };
useEffect(() => { fetchData(); }, [fetchData]);

// ✅ CORRECT - stable reference
const fetchData = useCallback(async () => { ... }, []);
useEffect(() => { fetchData(); }, [fetchData]);
```

---

### Issue: Real-time Not Working

**Symptom:** UI doesn't update when data changes

**Debugging Steps:**
1. Check console for subscription status
2. Verify channel name is unique
3. Confirm table has RLS SELECT policy
4. Test query manually in Supabase dashboard
5. Check filter matches expected user ID

**Common Causes:**
- Missing RLS policy blocks real-time
- Channel name collision (multiple subscriptions)
- Filter doesn't match user's data

---

### Issue: Member Count Incorrect

**Symptom:** Family shows wrong member count

**Cause:** `get_family_member_count()` query logic outdated

**Solution:**
1. Check pending profiles are "claimed" status
2. Verify active memberships have `status='active'`
3. Update function via migration if schema changed

---

## 10. Future Enhancements

### Planned Tables

1. **`user_cards`** - Card data associated with family members
2. **`card_field_values`** - Field values for cards
3. **`card_templates`** - Templates for card creation

### Planned View States

1. **Family Cards Tab:** Display/edit cards shared within family
2. **Family Timeline:** Chronological view of family events
3. **Family Analytics:** Stats on family connections, cards

### Planned Optimizations

1. **Denormalized Counts:** Store member counts in `family_units` table
2. **Materialized Views:** Pre-compute complex family trees
3. **GraphQL API:** Alternative to REST for complex queries

---

## Appendix A: Database Schema Diagram

```
┌─────────────────────┐
│    family_units     │
│─────────────────────│
│ id (PK)             │◄─┐
│ trust_anchor_user_id│  │
│ parent_family_id    │──┘
│ generation_level    │
│ family_label        │
│ is_active           │
└─────────────────────┘
          │
          │ (1:N)
          ▼
┌───────────────────────────┐
│ organization_memberships  │
│───────────────────────────│
│ id (PK)                   │
│ organization_user_id (FK) │───► trust_anchor_user_id
│ individual_user_id (FK)   │───► profiles.id
│ relationship_label        │
│ family_generation         │
│ is_family_unit            │
│ status                    │
└───────────────────────────┘
          │
          │ (N:1)
          ▼
┌─────────────────────┐
│      profiles       │
│─────────────────────│
│ id (PK) = auth.id   │
│ first_name          │
│ last_name           │
│ email               │
│ account_type        │
└─────────────────────┘

┌───────────────────────────┐
│ pending_family_profiles   │
│───────────────────────────│
│ id (PK)                   │
│ family_unit_id (FK)       │───► family_units.id
│ created_by (FK)           │───► profiles.id
│ first_name                │
│ relationship_label        │
│ status                    │
│ invitation_token          │
└───────────────────────────┘

┌───────────────────────────┐
│   family_invitations      │
│───────────────────────────│
│ id (PK)                   │
│ family_unit_id (FK)       │───► family_units.id
│ invitee_email             │
│ relationship_role         │
│ status                    │
│ invitation_token          │
└───────────────────────────┘

┌───────────────────────────┐
│   relationship_cards      │
│───────────────────────────│
│ id (PK)                   │
│ from_user_id (FK)         │───► profiles.id
│ to_user_id (FK)           │───► profiles.id
│ reciprocal_card_id (FK)   │──┐
│ relationship_label_from   │  │
│ relationship_label_to     │  │
│ status                    │  │
│ invitation_token          │  │
└───────────────────────────┘  │
          ▲                     │
          └─────────────────────┘
```

---

## Document Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-08 | System | Initial comprehensive database-route mappings document |

---

**End of Database-Route Mappings Document**
