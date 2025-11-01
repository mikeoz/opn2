# Reciprocal Sharing Architecture

**Version:** 1.0  
**Date:** 2025-11-01  
**Status:** Architecture Design Document

---

## 1. Executive Summary

This document defines the "reciprocal sharing" model for the Opn2 platform—a trust-first architecture that enables automatic propagation of data updates between users in established relationships, while maintaining transparency and user control.

### Core Value Proposition

Opn2 simplifies the complex information sharing that Normal Human Beings (NHBs) naturally handle in physical-world relationships by:
- Allowing data to "flow" automatically between trusted parties
- Notifying recipients of changes made by the data owner
- Providing low-friction revert options when needed
- Building trust through transparency and auditability

### Key Principle

**Trust-first, automatic updates with low-friction notifications and revert options.**

When User1 shares their addressCARD (labeled "Home Address") with User2 and later updates it, the Opn2 system automatically propagates that change to User2's copy while:
- Notifying User2 of the change
- Allowing User2 to revert within a 7-day window
- Maintaining complete audit history
- Reinforcing the trusted relationship

---

## 2. Core Principles and Philosophy

### 2.1 Trust-First Model

The Opn2 system operates on the principle of **"Trusted Services within Trust Relationships."** 

When two users establish a sharing relationship, they implicitly trust each other to maintain accurate information. Therefore, updates should flow automatically rather than requiring manual approval for each change.

**Rationale:**
- Mirrors real-world behavior: when a friend tells you they moved, you update your records automatically
- Reduces friction and cognitive load
- Reinforces trust through seamless interaction
- Honors the existing relationship rather than questioning each change

### 2.2 Automatic Acceptance as Default

Changes made by User1 to shared data are **automatically reflected** in User2's copy.

**Why automatic?**
- Trust relationships already established through initial share
- Exceptions (reverts) should be rare, not the norm
- Simpler mental model for NHBs
- Reduces notification fatigue

### 2.3 Revert as Exception, Not Rule

While updates are automatic, recipients retain **autonomy through revert capabilities**:
- 7-day revert window (configurable in future)
- Field-level granularity (revert some fields, keep others)
- Complete audit trail of what changed and when
- Low-friction "undo" option

**Design philosophy:** Make doing the right thing (accepting updates) easy, while preserving user control.

### 2.4 Balance: Complete Information Without Friction

The system must walk a fine line:
- **Information availability:** Users can access complete change history
- **Low friction:** No annoying prompts or blocking dialogs
- **Meaningful notifications:** Alert users to changes without overwhelming them
- **Auditability:** Full transparency when needed

### 2.5 Designing for Normal Human Beings (NHBs)

The architecture mirrors physical-world expectations:
- **Real world:** "Hey, I moved to a new address" → friend updates contact info
- **Opn2 equivalent:** User1 updates addressCARD → User2's copy auto-updates → User2 gets notification
- **Trust reinforcement:** Seamless flow strengthens relationship
- **Control preservation:** Revert option provides safety net

---

## 3. User Experience Flows

### 3.1 Initial Sharing Flow

**Scenario:** User1 shares their addressCARD with User2

**Steps:**
1. User1 selects their addressCARD (labeled "Home Address")
2. User1 chooses to share with User2
3. User1 sets field-level permissions (optional): City ✓, Street ✓, Apartment # ✗
4. System creates **snapshot** of current card data in User2's space
5. User2 receives in-app notification: "Mike Kirkland shared their Home Address with you"
6. Shared card appears in User2's "Connections" or "Relationships" view
7. User2 can now view the shared information according to granted permissions

**Technical Implementation:**
- Calls `create_shared_instance(card_id, recipient_id, permissions)`
- Creates row in `shared_card_instances` table
- Copies permitted fields to `snapshot_data` JSONB
- Links to original `card_relationships` for permission inheritance
- Creates initial notification in `update_notifications`

### 3.2 Update Propagation Flow

**Scenario:** User1 changes address from "123 Main St" to "456 Oak Ave"

**Steps:**
1. User1 edits their addressCARD and saves changes
2. System detects change via trigger on `user_cards` table
3. System identifies all shared instances of this card
4. For each recipient (including User2):
   - Creates `card_update_event` record with old/new values
   - **Automatically updates** `snapshot_data` in `shared_card_instances`
   - Creates notification in `update_notifications`
5. User2 sees in-app notification: "Mike Kirkland updated their Home Address"
6. User2's view of the card now shows "456 Oak Ave" (automatic)
7. Notification includes timestamp and change details
8. User2 can click notification to view full change history

**Technical Implementation:**
- Trigger: `propagate_card_update()` on UPDATE of `user_cards`
- JSON diff comparison to detect changed fields
- Batch creation of update events for all recipients
- Atomic update of all shared instances
- Notification creation with contextual data

**Example Notification:**
```
📬 Update: Home Address
Mike Kirkland changed their address
  Street: 123 Main St → 456 Oak Ave
  City: Springfield (unchanged)
2 minutes ago • Revert available for 7 days
```

### 3.3 Revert Flow

**Scenario:** User2 notices the address change and wants to keep the old value

**Steps:**
1. User2 views notification of change
2. User2 clicks "View Changes" or "Revert" button
3. System displays revert interface showing:
   - **Radio button list** of changed fields:
     - ☐ Street: 123 Main St ← 456 Oak Ave
     - ☐ City: Springfield (unchanged)
   - **"Revert All" button** for one-click full revert
   - **"Revert Selected" button** for field-level revert
   - Time remaining in revert window: "5 days, 14 hours remaining"
4. User2 selects fields to revert (or clicks "Revert All")
5. System confirms: "Revert address to previous value?"
6. User2 confirms
7. System:
   - Restores selected fields in `snapshot_data` to old values
   - Marks `card_update_events.reverted = TRUE` for those fields
   - Logs action in audit trail
   - Shows success message: "Address reverted to 123 Main St"

**Technical Implementation:**
- Calls `revert_card_update(event_id, user_id, fields[])`
- Validates revert window: `revert_window_expires_at > NOW()`
- Validates user is recipient: `recipient_user_id = auth.uid()`
- Updates `shared_card_instances.snapshot_data` for specified fields
- Updates `card_update_events` with revert metadata
- Creates audit log entry

**Revert Window:**
- Default: **7 days** from update timestamp
- After expiry: revert option disabled, but change history still visible
- Future: configurable per relationship type or card type

**Edge Case - Multiple Reverts:**
- User2 reverts change, User1 makes another update later
- New update creates new event, previous revert history preserved
- User2 sees timeline:
  - Original: 123 Main St
  - Change 1: 456 Oak Ave (reverted by you on Nov 2)
  - Change 2: 789 Elm St (active, 5 days to revert)

### 3.4 Change Reports

**Scenario:** User2 wants to review all changes in the last month

**Steps:**
1. User2 navigates to Shared Cards section
2. Clicks "View All Changes" or "Change Report"
3. System displays filterable report interface:
   - **Date range filter:** Last 7 days, 30 days, 90 days, Custom
   - **Entity filter:** All contacts, or specific person (e.g., "Mike Kirkland")
   - **Card type filter:** All cards, Address cards, Contact cards, etc.
   - **Status filter:** All changes, Accepted, Reverted
4. Report displays summary view:
   ```
   📊 Summary: Last 30 days
   - Total updates received: 12
   - Auto-accepted: 11
   - Reverted: 1
   - From 4 different contacts
   ```
5. User2 clicks "View Details" to expand
6. Detailed view shows:
   - Date/time of each change
   - Who made the change
   - What fields changed
   - Current status (accepted/reverted)
   - Action buttons (Revert if within window)
7. User2 can export report as CSV or PDF (future enhancement)

**Technical Implementation:**
- Query `card_update_events` joined with `shared_card_instances`
- Filter by recipient_user_id and date range
- Aggregate by status, entity, card type
- Order by event_timestamp DESC
- Paginate results for performance

**Report Columns:**
| Date | Contact | Card Type | Field | Old Value | New Value | Status | Actions |
|------|---------|-----------|-------|-----------|-----------|--------|---------|
| Nov 1 | Mike K. | Address | Street | 123 Main | 456 Oak | Accepted | [Revert] |
| Oct 28 | Sarah L. | Phone | Mobile | 555-0100 | 555-0200 | Reverted | - |

### 3.5 Suggest Correction Flow

**Scenario:** User2 notices User1's phone number seems incorrect

**Steps:**
1. User2 views User1's shared contactCARD
2. User2 notices phone number field: "555-0199" (seems wrong)
3. User2 clicks **"Suggest Correction" button** next to the field
4. System opens lightweight messaging interface:
   - Pre-populated subject: "Suggested correction: Contact Card - Mobile Phone"
   - Pre-filled context: "Current value: 555-0199"
   - Text area for User2's message: "Hi Mike, I think your mobile number might be incorrect. Did you mean 555-0100?"
   - [Send] button
5. User2 writes message and clicks Send
6. System sends message to User1 through existing messaging system
7. User1 receives notification: "Sarah suggested a correction to your Contact Card"
8. User1 can review and manually update if needed

**Technical Implementation:**
- Integrates with existing messaging system (out of scope for this architecture)
- Button component added to shared card field display
- Pre-populates message with card metadata:
  - Card name
  - Field name
  - Current value (if permitted)
  - Reference to shared_instance_id
- No automatic application of suggestions (manual only)

**Future Enhancement (Out of Scope):**
- In-system proposal workflow
- User1 can accept/reject suggestion with one click
- Accepted suggestions auto-update the card
- Rejected suggestions logged for audit
- AI-powered suggestion validation

---

## 4. Technical Architecture

### 4.1 Database Schema - Three New Tables

The reciprocal sharing model introduces three new tables that work in concert with existing structures:

#### 4.1.1 Table: `shared_card_instances`

**Purpose:** Stores snapshot copies of shared cards in the recipient's space.

```sql
CREATE TABLE shared_card_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  original_card_id UUID NOT NULL REFERENCES user_cards(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL, -- User1 (original owner)
  recipient_user_id UUID NOT NULL, -- User2 (recipient)
  relationship_id UUID REFERENCES card_relationships(id) ON DELETE CASCADE,
  
  -- Snapshot data (copy of card at time of share)
  snapshot_data JSONB NOT NULL,
  snapshot_version TEXT NOT NULL DEFAULT '1.0.0',
  
  -- Field-level permissions (inherited from share)
  field_permissions JSONB NOT NULL DEFAULT '{}',
  
  -- Status and metadata
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(original_card_id, recipient_user_id)
);

-- Indexes for performance
CREATE INDEX idx_shared_card_instances_recipient 
  ON shared_card_instances(recipient_user_id, status);
  
CREATE INDEX idx_shared_card_instances_owner 
  ON shared_card_instances(owner_user_id);
  
CREATE INDEX idx_shared_card_instances_relationship 
  ON shared_card_instances(relationship_id);
```

**Key Design Decisions:**
- **UNIQUE constraint** on (original_card_id, recipient_user_id): One user can only have one instance of a given card
- **ON DELETE CASCADE** for original_card_id: If owner deletes card, shared instances are removed
- **JSONB snapshot_data**: Stores complete copy of permitted fields at share time
- **field_permissions JSONB**: Stores which fields the recipient can see (e.g., `{"street": true, "apt": false}`)
- **status enum**: 'active' (normal), 'revoked' (owner revoked access), 'expired' (time-based expiry)

**Example snapshot_data:**
```json
{
  "data": {
    "address": {
      "street": "123 Main St",
      "city": "Springfield",
      "state": "IL",
      "zip": "62701"
    },
    "label": "Home Address"
  }
}
```

#### 4.1.2 Table: `card_update_events`

**Purpose:** Tracks individual field changes propagated to shared instances.

```sql
CREATE TABLE card_update_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  original_card_id UUID NOT NULL REFERENCES user_cards(id) ON DELETE CASCADE,
  shared_instance_id UUID NOT NULL REFERENCES shared_card_instances(id) ON DELETE CASCADE,
  
  -- Change tracking
  field_path TEXT NOT NULL, -- e.g., "data.address.street", "data.phone.mobile"
  old_value JSONB,
  new_value JSONB,
  change_type TEXT NOT NULL CHECK (change_type IN ('added', 'modified', 'deleted')),
  
  -- Event metadata
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  propagated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Revert tracking
  reverted BOOLEAN NOT NULL DEFAULT FALSE,
  reverted_at TIMESTAMPTZ,
  reverted_by UUID,
  revert_window_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL -- owner_user_id who made the change
);

-- Indexes for performance
CREATE INDEX idx_card_update_events_instance 
  ON card_update_events(shared_instance_id, event_timestamp DESC);
  
CREATE INDEX idx_card_update_events_revert 
  ON card_update_events(revert_window_expires_at) 
  WHERE NOT reverted;
  
CREATE INDEX idx_card_update_events_card 
  ON card_update_events(original_card_id, event_timestamp DESC);
```

**Key Design Decisions:**
- **field_path**: JSONPath-style string for precise field identification
- **JSONB old_value/new_value**: Preserves exact before/after state
- **change_type enum**: 'added' (new field), 'modified' (value changed), 'deleted' (field removed)
- **7-day revert window**: Calculated at event creation time
- **revert_window_expires_at**: Allows efficient querying of expiring events

**Example event:**
```json
{
  "id": "evt_123",
  "field_path": "data.address.street",
  "old_value": "123 Main St",
  "new_value": "456 Oak Ave",
  "change_type": "modified",
  "event_timestamp": "2025-11-01T14:30:00Z",
  "revert_window_expires_at": "2025-11-08T14:30:00Z",
  "reverted": false
}
```

#### 4.1.3 Table: `update_notifications`

**Purpose:** Manages in-app notifications for card updates.

```sql
CREATE TABLE update_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  update_event_id UUID NOT NULL REFERENCES card_update_events(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL,
  shared_instance_id UUID NOT NULL REFERENCES shared_card_instances(id) ON DELETE CASCADE,
  
  -- Notification content
  notification_type TEXT NOT NULL DEFAULT 'card_update' 
    CHECK (notification_type IN ('card_update', 'card_shared', 'card_revoked')),
  notification_data JSONB NOT NULL DEFAULT '{}',
  
  -- Status
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_update_notifications_recipient 
  ON update_notifications(recipient_user_id, created_at DESC);
  
CREATE INDEX idx_update_notifications_unread 
  ON update_notifications(recipient_user_id, read_at) 
  WHERE read_at IS NULL;
```

**Key Design Decisions:**
- **notification_type enum**: Different notification types for different events
- **notification_data JSONB**: Flexible payload for rich notifications
- **read_at/dismissed_at**: Track user interaction without deleting records
- **Partial index on unread**: Optimizes common "unread notifications" query

**Example notification_data:**
```json
{
  "owner_name": "Mike Kirkland",
  "card_label": "Home Address",
  "field_changes": [
    {
      "field": "Street",
      "old": "123 Main St",
      "new": "456 Oak Ave"
    }
  ],
  "change_count": 1,
  "revert_deadline": "2025-11-08T14:30:00Z"
}
```

### 4.2 Row-Level Security (RLS) Policies

All three tables enforce strict RLS to ensure users can only access their own data.

#### 4.2.1 RLS for `shared_card_instances`

```sql
-- Enable RLS
ALTER TABLE shared_card_instances ENABLE ROW LEVEL SECURITY;

-- Recipients can view their own shared instances
CREATE POLICY "Recipients view their instances"
  ON shared_card_instances
  FOR SELECT
  USING (auth.uid() = recipient_user_id);

-- Owners can view instances they've shared
CREATE POLICY "Owners view shared instances"
  ON shared_card_instances
  FOR SELECT
  USING (auth.uid() = owner_user_id);

-- Only system functions can create instances (via SECURITY DEFINER)
CREATE POLICY "System creates instances"
  ON shared_card_instances
  FOR INSERT
  WITH CHECK (false); -- Blocked at policy level, allowed via SECURITY DEFINER functions

-- Recipients can update status (for requesting revocation)
CREATE POLICY "Recipients request revocation"
  ON shared_card_instances
  FOR UPDATE
  USING (auth.uid() = recipient_user_id)
  WITH CHECK (
    auth.uid() = recipient_user_id 
    AND status IN ('active', 'revoked')
  );

-- Owners can update/delete (for revoking access)
CREATE POLICY "Owners revoke instances"
  ON shared_card_instances
  FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners delete instances"
  ON shared_card_instances
  FOR DELETE
  USING (auth.uid() = owner_user_id);
```

**Security Rationale:**
- Recipients can only see snapshots shared with them
- Owners maintain visibility for audit purposes
- INSERT blocked to prevent manual creation (must use controlled functions)
- Recipients can't directly modify snapshot data (only via revert functions)

#### 4.2.2 RLS for `card_update_events`

```sql
-- Enable RLS
ALTER TABLE card_update_events ENABLE ROW LEVEL SECURITY;

-- Recipients can view events for their shared instances
CREATE POLICY "Recipients view their update events"
  ON card_update_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shared_card_instances
      WHERE id = card_update_events.shared_instance_id
        AND recipient_user_id = auth.uid()
    )
  );

-- Owners can view events they created
CREATE POLICY "Owners view their update events"
  ON card_update_events
  FOR SELECT
  USING (created_by = auth.uid());

-- System functions create events (INSERT via SECURITY DEFINER)
CREATE POLICY "System creates update events"
  ON card_update_events
  FOR INSERT
  WITH CHECK (false);

-- Recipients can mark events as reverted (via SECURITY DEFINER function)
CREATE POLICY "System marks reverts"
  ON card_update_events
  FOR UPDATE
  WITH CHECK (false);

-- No direct deletes allowed
```

**Security Rationale:**
- Cross-table RLS join ensures recipients only see their events
- Owners see all events they generated for audit trail
- All mutations go through controlled SECURITY DEFINER functions
- Prevents tampering with event history

#### 4.2.3 RLS for `update_notifications`

```sql
-- Enable RLS
ALTER TABLE update_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users view own notifications"
  ON update_notifications
  FOR SELECT
  USING (recipient_user_id = auth.uid());

-- Users can update their own notification status
CREATE POLICY "Users update own notifications"
  ON update_notifications
  FOR UPDATE
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());

-- System functions create notifications
CREATE POLICY "System creates notifications"
  ON update_notifications
  FOR INSERT
  WITH CHECK (false);

-- Users can delete/dismiss their own notifications
CREATE POLICY "Users delete own notifications"
  ON update_notifications
  FOR DELETE
  USING (recipient_user_id = auth.uid());
```

**Security Rationale:**
- Strong isolation: users only see their own notifications
- Read/unread status controlled by recipient
- Creation controlled to prevent notification spoofing

### 4.3 Core Database Functions

All state-changing operations use SECURITY DEFINER functions to safely cross RLS boundaries.

#### 4.3.1 Function: `create_shared_instance()`

**Purpose:** Creates a new shared instance when User1 shares a card with User2.

```sql
CREATE OR REPLACE FUNCTION public.create_shared_instance(
  p_card_id UUID,
  p_recipient_id UUID,
  p_permissions JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_instance_id UUID;
  v_owner_id UUID;
  v_card_data JSONB;
  v_filtered_data JSONB;
  v_relationship_id UUID;
BEGIN
  -- Get card owner and data
  SELECT user_id, 
         jsonb_build_object(
           'data', (SELECT jsonb_object_agg(key, value)
                    FROM jsonb_each((SELECT data FROM card_field_values cfv 
                                     JOIN template_fields tf ON tf.id = cfv.template_field_id
                                     WHERE cfv.user_card_id = p_card_id))
                    WHERE p_permissions ? key OR p_permissions = '{}'::jsonb)
         )
  INTO v_owner_id, v_card_data
  FROM user_cards
  WHERE id = p_card_id;
  
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Card not found';
  END IF;
  
  -- Get or create relationship
  SELECT id INTO v_relationship_id
  FROM card_relationships
  WHERE card_id = p_card_id
    AND shared_with_user_id = p_recipient_id;
  
  -- Create shared instance
  INSERT INTO shared_card_instances (
    original_card_id,
    owner_user_id,
    recipient_user_id,
    relationship_id,
    snapshot_data,
    field_permissions,
    status
  ) VALUES (
    p_card_id,
    v_owner_id,
    p_recipient_id,
    v_relationship_id,
    v_card_data,
    p_permissions,
    'active'
  )
  RETURNING id INTO v_instance_id;
  
  -- Create initial notification
  INSERT INTO update_notifications (
    update_event_id, -- NULL for initial share
    recipient_user_id,
    shared_instance_id,
    notification_type,
    notification_data
  ) VALUES (
    NULL,
    p_recipient_id,
    v_instance_id,
    'card_shared',
    jsonb_build_object(
      'owner_name', (SELECT COALESCE(first_name || ' ' || last_name, email) 
                     FROM profiles WHERE id = v_owner_id),
      'card_label', (SELECT data->>'label' FROM user_cards WHERE id = p_card_id),
      'shared_at', NOW()
    )
  );
  
  RETURN v_instance_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_shared_instance TO authenticated;
```

**Key Features:**
- Extracts only permitted fields based on `p_permissions` JSONB
- Creates initial snapshot in recipient's space
- Links to existing `card_relationships` for permission inheritance
- Creates "card_shared" notification
- Returns instance ID for caller reference

#### 4.3.2 Function: `propagate_card_update()`

**Purpose:** Trigger function that automatically propagates updates to all shared instances.

```sql
CREATE OR REPLACE FUNCTION public.propagate_card_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_instance RECORD;
  v_field_key TEXT;
  v_old_val JSONB;
  v_new_val JSONB;
  v_event_id UUID;
  v_change_count INTEGER := 0;
BEGIN
  -- Only propagate on UPDATE, not INSERT
  IF TG_OP != 'UPDATE' THEN
    RETURN NEW;
  END IF;
  
  -- Find all active shared instances of this card
  FOR v_instance IN 
    SELECT id, recipient_user_id, field_permissions, snapshot_data
    FROM shared_card_instances
    WHERE original_card_id = NEW.id
      AND status = 'active'
  LOOP
    -- Compare OLD and NEW data to detect changes
    -- This is simplified; real implementation needs JSONB diff logic
    
    -- For each permitted field that changed:
    FOR v_field_key IN 
      SELECT key FROM jsonb_object_keys(v_instance.field_permissions) AS key
      WHERE v_instance.field_permissions->key = 'true'::jsonb
    LOOP
      -- Extract old and new values for this field
      v_old_val := OLD.data -> v_field_key;
      v_new_val := NEW.data -> v_field_key;
      
      -- Skip if values are identical
      CONTINUE WHEN v_old_val = v_new_val;
      
      -- Create update event
      INSERT INTO card_update_events (
        original_card_id,
        shared_instance_id,
        field_path,
        old_value,
        new_value,
        change_type,
        created_by
      ) VALUES (
        NEW.id,
        v_instance.id,
        'data.' || v_field_key,
        v_old_val,
        v_new_val,
        CASE 
          WHEN v_old_val IS NULL THEN 'added'
          WHEN v_new_val IS NULL THEN 'deleted'
          ELSE 'modified'
        END,
        NEW.user_id
      )
      RETURNING id INTO v_event_id;
      
      -- Update snapshot with new value
      UPDATE shared_card_instances
      SET snapshot_data = jsonb_set(
            snapshot_data,
            ARRAY['data', v_field_key],
            v_new_val
          ),
          last_synced_at = NOW()
      WHERE id = v_instance.id;
      
      -- Create notification
      INSERT INTO update_notifications (
        update_event_id,
        recipient_user_id,
        shared_instance_id,
        notification_type,
        notification_data
      ) VALUES (
        v_event_id,
        v_instance.recipient_user_id,
        v_instance.id,
        'card_update',
        jsonb_build_object(
          'owner_name', (SELECT COALESCE(first_name || ' ' || last_name, email) 
                         FROM profiles WHERE id = NEW.user_id),
          'card_label', NEW.data->>'label',
          'field_changes', jsonb_build_array(
            jsonb_build_object(
              'field', v_field_key,
              'old', v_old_val,
              'new', v_new_val
            )
          ),
          'change_count', 1,
          'revert_deadline', NOW() + INTERVAL '7 days'
        )
      );
      
      v_change_count := v_change_count + 1;
    END LOOP;
  END LOOP;
  
  -- Log propagation
  IF v_change_count > 0 THEN
    RAISE NOTICE 'Propagated % changes to % instances', v_change_count, v_change_count;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER trigger_propagate_card_update
  AFTER UPDATE ON user_cards
  FOR EACH ROW
  EXECUTE FUNCTION propagate_card_update();
```

**Key Features:**
- Automatically fires on any `user_cards` UPDATE
- Performs field-by-field comparison (simplified in example)
- Respects field permissions (only propagates permitted fields)
- Atomically updates snapshot data
- Creates event + notification for each change
- SECURITY DEFINER allows cross-user writes

**Production Considerations:**
- Implement efficient JSONB diff algorithm
- Batch notification creation for performance
- Consider async queue for large recipient lists
- Add rate limiting to prevent abuse

#### 4.3.3 Function: `revert_card_update()`

**Purpose:** Allows recipient to revert specific field changes within the 7-day window.

```sql
CREATE OR REPLACE FUNCTION public.revert_card_update(
  p_event_id UUID,
  p_user_id UUID,
  p_fields TEXT[] DEFAULT NULL -- NULL means revert all fields
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_instance RECORD;
  v_reverted_count INTEGER := 0;
BEGIN
  -- Get event details
  SELECT * INTO v_event
  FROM card_update_events
  WHERE id = p_event_id;
  
  IF v_event IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event not found');
  END IF;
  
  -- Get instance and verify recipient
  SELECT * INTO v_instance
  FROM shared_card_instances
  WHERE id = v_event.shared_instance_id;
  
  IF v_instance.recipient_user_id != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;
  
  -- Check revert window
  IF v_event.revert_window_expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Revert window expired');
  END IF;
  
  -- Check if already reverted
  IF v_event.reverted THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already reverted');
  END IF;
  
  -- Revert the field(s) in snapshot_data
  -- Extract field path and restore old value
  UPDATE shared_card_instances
  SET snapshot_data = jsonb_set(
        snapshot_data,
        string_to_array(v_event.field_path, '.'),
        v_event.old_value
      ),
      updated_at = NOW()
  WHERE id = v_instance.id;
  
  -- Mark event as reverted
  UPDATE card_update_events
  SET reverted = TRUE,
      reverted_at = NOW(),
      reverted_by = p_user_id
  WHERE id = p_event_id;
  
  -- Log audit trail
  INSERT INTO audit_logs (
    table_name,
    operation,
    record_id,
    old_values,
    new_values,
    user_id
  ) VALUES (
    'card_update_events',
    'REVERT',
    p_event_id,
    jsonb_build_object('field_path', v_event.field_path, 'value', v_event.new_value),
    jsonb_build_object('field_path', v_event.field_path, 'value', v_event.old_value),
    p_user_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'reverted_field', v_event.field_path,
    'restored_value', v_event.old_value
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.revert_card_update TO authenticated;
```

**Key Features:**
- Validates revert window (7 days)
- Validates requesting user is recipient
- Restores old value in snapshot_data
- Marks event as reverted with timestamp
- Creates audit log entry
- Returns success/error JSONB

**Field-Level Revert (Future Enhancement):**
```sql
-- For multiple fields, wrap in transaction and call per field
BEGIN;
  SELECT revert_card_update('event1', user_id, ARRAY['street']);
  SELECT revert_card_update('event2', user_id, ARRAY['city']);
COMMIT;
```

#### 4.3.4 Function: `revoke_shared_instance()`

**Purpose:** Allows owner to revoke access to a shared card.

```sql
CREATE OR REPLACE FUNCTION public.revoke_shared_instance(
  p_instance_id UUID,
  p_owner_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_instance RECORD;
BEGIN
  -- Get instance and verify owner
  SELECT * INTO v_instance
  FROM shared_card_instances
  WHERE id = p_instance_id;
  
  IF v_instance IS NULL THEN
    RAISE EXCEPTION 'Instance not found';
  END IF;
  
  IF v_instance.owner_user_id != p_owner_id THEN
    RAISE EXCEPTION 'Not authorized to revoke';
  END IF;
  
  -- Update status to revoked
  UPDATE shared_card_instances
  SET status = 'revoked',
      updated_at = NOW()
  WHERE id = p_instance_id;
  
  -- Create revocation notification
  INSERT INTO update_notifications (
    update_event_id,
    recipient_user_id,
    shared_instance_id,
    notification_type,
    notification_data
  ) VALUES (
    NULL,
    v_instance.recipient_user_id,
    p_instance_id,
    'card_revoked',
    jsonb_build_object(
      'owner_name', (SELECT COALESCE(first_name || ' ' || last_name, email) 
                     FROM profiles WHERE id = p_owner_id),
      'card_label', v_instance.snapshot_data->'data'->>'label',
      'revoked_at', NOW()
    )
  );
  
  -- Log audit trail
  INSERT INTO audit_logs (
    table_name,
    operation,
    record_id,
    new_values,
    user_id
  ) VALUES (
    'shared_card_instances',
    'REVOKE',
    p_instance_id,
    jsonb_build_object('status', 'revoked'),
    p_owner_id
  );
  
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_shared_instance TO authenticated;
```

**Key Features:**
- Validates owner permissions
- Updates status to 'revoked' (preserves history)
- Notifies recipient of revocation
- Maintains audit trail

**Revocation Behavior:**
- Snapshot data remains (recipient keeps last known values)
- Future updates no longer propagate
- Recipient can still view historical data
- Alternative: push null values to "erase" data (configurable)

---

## 5. Security and RLS Considerations

### 5.1 Copy/Snapshot Model vs. Live-Linked Model

**Decision: Copy/Snapshot Model (Selected)**

#### How It Works:
1. When User1 shares a card, system creates **complete copy** of permitted fields in User2's space
2. Copy stored in `shared_card_instances.snapshot_data` (JSONB)
3. Updates are **pushed** to recipient's copy via `propagate_card_update()` trigger
4. Recipient "owns" their snapshot (RLS: `recipient_user_id = auth.uid()`)

#### Advantages:
✅ **Simpler RLS:** Recipient queries their own data, no cross-user joins  
✅ **Better performance:** Direct queries, no permission checks on every read  
✅ **Data independence:** Recipient's copy survives owner account deletion  
✅ **Easier reverts:** Simply restore old value in recipient's snapshot  
✅ **Clearer mental model:** "You shared this with me, now I have a copy"  
✅ **Scales better:** Bulk sharing doesn't create complex permission matrices

#### Disadvantages:
❌ **Storage overhead:** Each recipient has separate copy  
❌ **Sync complexity:** Must propagate updates to all copies  
❌ **Potential inconsistency:** If propagation fails, copies can drift  

#### Why This Fits Opn2:
- Current use cases (contact information) favor **data ownership**
- Trust-first model aligns with "you gave me this data" mental model
- Simpler to explain to Normal Human Beings
- Better aligns with revert functionality (can't revert someone else's data)

---

**Alternative: Live-Linked Model (Not Chosen)**

#### How It Would Work:
1. When User1 shares a card, no copy is created
2. User2 queries User1's `user_cards` table through filtered RLS view
3. Permissions enforced at query time via complex RLS policies
4. Updates are "live" - User2 always sees User1's current data

#### Advantages:
✅ **No storage duplication:** Single source of truth  
✅ **Always current:** No sync needed  
✅ **Simpler revocation:** Just remove permission, data instantly gone  

#### Disadvantages:
❌ **Complex RLS:** Cross-user policies like `EXISTS (SELECT ... WHERE shared_with_user_id = auth.uid())`  
❌ **Performance:** Every query checks permissions across users  
❌ **No revert:** Can't revert someone else's live data  
❌ **Data loss:** If owner deletes card, recipient loses access to all history  
❌ **Harder to understand:** "Do I have this data or just permission to see it?"

#### Why Not Chosen:
- Trust-first model wants recipients to "own" the shared data
- Revert functionality fundamentally incompatible
- Doesn't align with NHB expectations (physical-world metaphor)

---

### 5.2 RLS Security Patterns

All three new tables use **strict isolation** enforced by RLS:

#### Pattern 1: Direct Ownership
```sql
-- Users can only see records where they are the recipient
CREATE POLICY "view_own_records"
  ON shared_card_instances
  FOR SELECT
  USING (auth.uid() = recipient_user_id);
```

**Used for:** `shared_card_instances`, `update_notifications`  
**Security guarantee:** Users can never see other users' data

#### Pattern 2: Cross-Table Verification
```sql
-- Recipients can only see events for instances they own
CREATE POLICY "view_own_events"
  ON card_update_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shared_card_instances
      WHERE id = card_update_events.shared_instance_id
        AND recipient_user_id = auth.uid()
    )
  );
```

**Used for:** `card_update_events`  
**Security guarantee:** Even if event IDs are leaked, users can't access others' events

#### Pattern 3: SECURITY DEFINER Functions
```sql
-- Direct INSERT blocked, only controlled functions allowed
CREATE POLICY "no_direct_insert"
  ON shared_card_instances
  FOR INSERT
  WITH CHECK (false);

-- Function bypasses RLS to create instance
CREATE FUNCTION create_shared_instance(...)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with function owner's permissions
SET search_path = public  -- Prevents search_path attacks
AS $$ ... $$;
```

**Used for:** All state-changing operations  
**Security guarantee:** All writes go through validated business logic

#### Pattern 4: Owner Audit Trail
```sql
-- Owners can view instances they've shared (for audit)
CREATE POLICY "owners_view_shared"
  ON shared_card_instances
  FOR SELECT
  USING (auth.uid() = owner_user_id);
```

**Used for:** `shared_card_instances`, `card_update_events`  
**Security guarantee:** Owners can audit who they've shared with, but can't modify recipient data

### 5.3 Data Ownership and Deletion

**Question:** What happens when User1 deletes their account?

**Answer:** Recipient keeps their snapshot copy.

```sql
-- When user_cards row is deleted:
original_card_id UUID REFERENCES user_cards(id) ON DELETE CASCADE
-- ... would CASCADE delete shared instances

-- BUT we change this to:
original_card_id UUID REFERENCES user_cards(id) ON DELETE SET NULL
-- ... and add owner_user_id for reference
```

**Revised approach:**
- `ON DELETE SET NULL` for `original_card_id`
- Shared instance remains with `original_card_id = NULL`
- Recipient keeps historical snapshot
- No future updates (card doesn't exist)
- Audit trail preserved

**Alternative (stricter):**
- `ON DELETE CASCADE` removes all shared instances
- Recipient loses access to all historical data
- Aligns with "right to be forgotten" regulations
- Less friendly to trust model

**Recommendation:** `SET NULL` for MVP, configurable per use case later.

### 5.4 Rate Limiting and Abuse Prevention

**Potential attack vectors:**

1. **Spam sharing:** User1 shares 1000 cards with User2
   - **Mitigation:** Rate limit on `create_shared_instance()` calls (e.g., 100/hour)
   
2. **Update flooding:** User1 rapidly updates shared card to spam User2
   - **Mitigation:** Debounce propagation (max 1 notification per 5 minutes per card)
   
3. **Revert abuse:** User2 reverts and re-reverts repeatedly
   - **Mitigation:** Limit reverts to 3 per event, log excessive reverts

4. **Storage overflow:** User1 creates 10,000 shared instances
   - **Mitigation:** Quota on active shared instances per user (e.g., 500 max)

**Implementation (Future):**
```sql
-- Add to shared_card_instances
CREATE TABLE user_sharing_quotas (
  user_id UUID PRIMARY KEY,
  active_shares_out INTEGER DEFAULT 0, -- How many I've shared
  active_shares_in INTEGER DEFAULT 0,  -- How many shared with me
  max_shares_out INTEGER DEFAULT 500,
  max_shares_in INTEGER DEFAULT 1000
);
```

---

## 6. Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

**Goal:** Establish database foundation and basic sharing

**Tasks:**
1. **Database migration:**
   - Create `shared_card_instances` table
   - Create `card_update_events` table
   - Create `update_notifications` table
   - Add RLS policies to all three tables
   
2. **Core functions:**
   - Implement `create_shared_instance()`
   - Add grant statements for authenticated users
   - Write unit tests for function

3. **UI updates:**
   - Add "Share Card" button to existing card views
   - Reuse existing share dialog, modify to use `create_shared_instance()`
   - Display shared instances in recipient's "Connections" view

4. **Testing:**
   - Test RLS policies with different users
   - Verify snapshot creation with field permissions
   - Test basic share flow end-to-end

**Success criteria:**
- User1 can share card with User2
- User2 sees snapshot in their space
- RLS prevents unauthorized access

---

### Phase 2: Update Propagation (Week 3-4)

**Goal:** Automatic updates from owner to recipients

**Tasks:**
1. **Propagation function:**
   - Implement `propagate_card_update()` trigger function
   - Implement JSONB diff logic for change detection
   - Add field-level change tracking
   
2. **Trigger setup:**
   - Create trigger on `user_cards` UPDATE
   - Test with single recipient
   - Test with multiple recipients (family unit scenario)

3. **Notification creation:**
   - Auto-create `update_notifications` for each change
   - Display notifications in existing NotificationCenter
   - Add notification type badge for "card_update"

4. **Testing:**
   - User1 updates card → User2's snapshot auto-updates
   - Notifications appear for User2
   - Field permissions respected (unpermitted fields don't propagate)

**Success criteria:**
- Updates propagate within 1 second
- Notifications created for all recipients
- Snapshot data correctly updated

---

### Phase 3: Revert Functionality (Week 5-6)

**Goal:** Allow recipients to revert changes within 7 days

**Tasks:**
1. **Revert function:**
   - Implement `revert_card_update()` function
   - Add 7-day window validation
   - Add audit logging

2. **Revert UI:**
   - Add "View Changes" button to shared card display
   - Create revert dialog with field-level granularity:
     - Radio buttons for individual field reverts
     - "Revert All" button
     - Countdown timer showing revert deadline
   - Integrate with existing dialog components

3. **Notification enhancements:**
   - Add "Revert" action button to update notifications
   - Show revert status in change history
   - Display "Revert window expired" for old changes

4. **Testing:**
   - Test revert within window (success)
   - Test revert after expiry (blocked)
   - Test partial revert (some fields, not all)
   - Test multiple reverts (edge case handling)

**Success criteria:**
- Recipients can revert within 7 days
- Snapshot correctly restored to old values
- Event marked as reverted in database
- Audit log created

---

### Phase 4: Change Reports (Week 7-8)

**Goal:** Historical view of all changes

**Tasks:**
1. **Report query logic:**
   - Create API endpoint for fetching update events
   - Implement filtering by date, entity, card type, status
   - Add pagination (50 events per page)

2. **Report UI:**
   - Create "Change Report" page/component
   - Add filter controls (date picker, dropdown selectors)
   - Display summary view:
     - Total updates, accepted count, reverted count
     - Breakdown by contact
   - Display detailed table view:
     - Date, Contact, Card Type, Field, Old Value, New Value, Status
     - Action buttons (Revert if within window)
   - Add export functionality (CSV for MVP)

3. **Performance optimization:**
   - Add indexes for common filter combinations
   - Implement query caching
   - Test with large datasets (1000+ events)

4. **Testing:**
   - Test filters individually and in combination
   - Test pagination with large result sets
   - Test CSV export

**Success criteria:**
- Users can view all changes from last 90 days
- Filters work correctly
- Report loads in < 2 seconds

---

### Phase 5: Suggest Correction (Week 9-10)

**Goal:** Lightweight correction suggestions

**Tasks:**
1. **UI integration:**
   - Add "Suggest Correction" button to shared card field display
   - Show button next to each field (or card-level for MVP)
   
2. **Messaging integration:**
   - Pre-populate message subject and body
   - Include card reference metadata (instance_id, field_path)
   - Send through existing messaging system (out of scope for this doc)
   
3. **Notification for owner:**
   - Owner receives: "Sarah suggested a correction to your Contact Card"
   - Link to specific card and field
   
4. **Testing:**
   - Test message creation with correct metadata
   - Test owner notification delivery
   - Test from recipient's perspective

**Success criteria:**
- Button appears on shared cards
- Message pre-populated with correct context
- Owner receives notification

**Out of scope:**
- Automatic application of suggestions
- Approval/rejection workflow
- Batch suggestions

---

### Phase 6: Bulk Updates for Family Units (Week 11-12)

**Goal:** Propagate updates to all family members

**Tasks:**
1. **Bulk sharing:**
   - Extend `create_shared_instance()` to accept array of recipients
   - Batch create instances for all family members
   - Transaction wrapper for atomicity

2. **Bulk propagation:**
   - `propagate_card_update()` already handles multiple recipients
   - Test with family of 10 members
   - Monitor performance

3. **UI for family sharing:**
   - "Share with Family" button on cards
   - Select which family unit(s) to share with
   - Preview: "This will share with 8 family members"
   
4. **Reporting:**
   - Family trust anchor can view aggregate acceptance:
     - "Home Address update: 7/8 members accepted, 1 reverted"
   - Individual members still accept/revert independently

5. **Testing:**
   - Share with family of 10
   - Update → all 10 receive updates
   - Some accept, some revert → verify independence
   - Test with nested family units (multi-generational)

**Success criteria:**
- Bulk sharing completes in < 5 seconds for 10 recipients
- All members receive individual update events
- Each member can independently revert
- No blocking or consensus mechanism needed

---

## 7. Edge Cases and Future Considerations

### 7.1 Current Scope Edge Cases

#### Edge Case 1: Cascading Reverts

**Scenario:**  
1. User2 reverts Update 1 (street: "123 Main" → "456 Oak")  
2. User1 makes Update 2 (street: "456 Oak" → "789 Elm")  
3. What does User2 see?

**Solution:**
- New update creates **new event**, previous revert history preserved
- User2's timeline:
  ```
  Original: 123 Main St
  Update 1: 456 Oak Ave (reverted by you on Nov 2)
  Update 2: 789 Elm St (current, 6 days to revert)
  ```
- User2's snapshot shows: "789 Elm St" (latest)
- User2 can revert Update 2 independently
- Audit trail shows both updates and revert of Update 1

**Implementation:**
- Each update event is independent
- Reverts only affect specific events, not future ones
- Timeline view shows all events chronologically

---

#### Edge Case 2: Partial Revert (Field-Level)

**Scenario:**  
1. User1 updates both "street" and "city" simultaneously  
2. User2 wants to revert "city" but accept "street"

**Solution:**
- Create separate `card_update_event` for each field
- User2 can revert individual events:
  ```
  Event 1: street change → User2 accepts
  Event 2: city change → User2 reverts
  ```
- Snapshot ends up with mixed state: new street, old city
- UI clearly shows: "Mixed: some changes accepted, some reverted"

**Implementation:**
- `propagate_card_update()` creates one event per field change
- Revert UI allows selecting individual events
- Snapshot updated independently per field

---

#### Edge Case 3: Revert Window Expiry

**Scenario:**  
1. Update propagated on Nov 1  
2. 7 days pass (Nov 8)  
3. User2 tries to revert on Nov 9

**Solution:**
- `revert_card_update()` function checks `revert_window_expires_at < NOW()`
- Returns error: "Revert window expired"
- UI shows: "Update applied Nov 1 (revert expired)"
- Change history still visible, just no action available

**Implementation:**
- Scheduled function (cron) marks expired events daily:
  ```sql
  UPDATE card_update_events
  SET metadata = metadata || '{"expired": true}'
  WHERE revert_window_expires_at < NOW()
    AND NOT reverted;
  ```
- UI checks expiry before showing revert button

---

#### Edge Case 4: Owner Account Deletion

**Scenario:**  
1. User1 shares card with User2  
2. User1 deletes their entire account  
3. What happens to User2's shared instance?

**Decision:** Keep snapshot (recipient's data independence)

**Solution:**
```sql
-- Change foreign key behavior
original_card_id UUID REFERENCES user_cards(id) ON DELETE SET NULL
```

**Result:**
- `shared_card_instances.original_card_id` becomes NULL
- Snapshot data remains intact
- Status remains 'active' but no future updates possible
- User2 can still view historical data
- UI shows: "This card is no longer updated (owner deleted account)"

**Alternative (stricter):**
```sql
ON DELETE CASCADE  -- Deletes shared instances too
```
- Aligns with "right to be forgotten"
- Recipient loses all historical data
- Not chosen for MVP (too aggressive)

---

#### Edge Case 5: Multiple Recipients with Different Permissions

**Scenario:**  
1. User1 shares with User2 (street: ✓, apt: ✓)  
2. User1 shares with User3 (street: ✓, apt: ✗)  
3. User1 updates apartment number

**Solution:**
- `propagate_card_update()` respects field permissions per instance
- User2 receives update (has permission for "apt")
- User3 does **not** receive update (no permission for "apt")
- Creates events only for permitted fields

**Implementation:**
```sql
-- In propagate_card_update()
FOR v_field_key IN SELECT key FROM field_permissions
  WHERE field_permissions->key = 'true'  -- Only if permitted
```

---

#### Edge Case 6: Conflicting Reverts (Multiple Shared Instances)

**Scenario:**  
1. User1 shares with User2 and User3  
2. User1 updates street  
3. User2 reverts, User3 accepts  
4. User1 later wants to know "which version did each person see?"

**Solution:**
- Each instance has independent revert state
- User1 can query:
  ```sql
  SELECT recipient_user_id,
         snapshot_data->'data'->'address'->>'street' AS current_street,
         (SELECT reverted FROM card_update_events 
          WHERE shared_instance_id = si.id 
          ORDER BY event_timestamp DESC LIMIT 1) AS latest_reverted
  FROM shared_card_instances si
  WHERE owner_user_id = 'user1_id';
  ```
- Result:
  ```
  User2: "123 Main St" (reverted)
  User3: "456 Oak Ave" (accepted)
  ```

**UI for Owner (Future):**
- "Sharing Status" view shows all recipients' current states
- Helpful for understanding "who has what version?"

---

### 7.2 Future Enhancements (Out of Current Scope)

#### Enhancement 1: AI-Agent Integration

**Use Case:** User shares medical records with AI health advisor

**Considerations:**
- Agents may need different trust model (explicit permissions)
- Agent-to-Agent sharing for automated workflows
- Machine-readable consent receipts
- Different revert semantics (agents can't "revert" updates)

**Implementation approach:**
- Add `is_agent` boolean to `profiles` table
- New `scope: 'agent'` in field policies (from policy_engine.ts)
- Agents receive updates but can't revert (read-only snapshots)
- Agent actions logged differently (e.g., "AI processed this data")

**Timeline:** Phase 7+ (after MVP)

---

#### Enhancement 2: Advanced Relationship-Based Update Policies

**Use Case:** Different auto-accept behavior per relationship type

**Examples:**
- "Friend" → auto-accept all updates
- "Colleague" → require review for home address changes
- "Service Provider" → read-only, no update propagation

**Implementation approach:**
- Add `update_policy` JSONB to `card_relationships`:
  ```json
  {
    "auto_accept": true,
    "requires_review": ["address.street", "phone.mobile"],
    "propagation": "automatic" | "manual" | "none"
  }
  ```
- Modify `propagate_card_update()` to check policy before propagating
- UI for setting policies during initial share

**Timeline:** Phase 8+ (after user feedback on basic model)

---

#### Enhancement 3: Two-Way Synchronization

**Use Case:** Collaborative family emergency contacts card

**Scenario:**
- Family maintains shared emergency contacts
- Any member can propose updates
- Updates auto-accepted if from trusted family members

**Implementation approach:**
- Add `is_collaborative` boolean to `shared_card_instances`
- Recipient can propose changes back to owner
- Owner auto-accepts (or requires review based on policy)
- Creates "proposal" workflow distinct from revert

**Complexity:**
- Conflict resolution if two members update simultaneously
- Permission model (who can edit what fields?)
- Merge logic similar to vCard merge engine

**Timeline:** Phase 10+ (significant complexity)

---

#### Enhancement 4: Configurable Revert Windows

**Use Case:** Different data types have different change frequencies

**Examples:**
- Birthday: 365 days (rarely changes, should be reviewable for a year)
- Phone number: 7 days (current default)
- Location: 1 day (frequently changes, short revert window)

**Implementation approach:**
- Add `revert_window_days` to sharing metadata or field policies
- Calculate `revert_window_expires_at` dynamically:
  ```sql
  NOW() + INTERVAL (revert_window_days || ' days')
  ```
- UI for setting window during share or per card type

**Configuration levels:**
1. Global default (7 days)
2. Per card type (address: 7d, birthday: 365d)
3. Per relationship (family: 30d, colleague: 3d)
4. Per share instance (one-off override)

**Timeline:** Phase 9+ (after understanding usage patterns)

---

#### Enhancement 5: Real-Time Synchronization

**Use Case:** Live collaboration on shared documents or cards

**Implementation approach:**
- Supabase Realtime integration
- WebSocket-based immediate propagation
- User sees update in real-time if online (no page refresh)

**Architecture:**
```typescript
// Frontend listens to changes
const subscription = supabase
  .channel('shared-cards')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'card_update_events',
    filter: `shared_instance_id=eq.${instanceId}`
  }, (payload) => {
    // Immediately update UI with new snapshot data
    updateCardDisplay(payload.new);
  })
  .subscribe();
```

**Benefits:**
- Reduces latency from minutes to seconds
- Better UX for active collaboration
- Aligns with modern app expectations

**Timeline:** Phase 11+ (requires Realtime setup)

---

#### Enhancement 6: Differential Privacy for Sensitive Fields

**Use Case:** Share location updates with time delay to prevent real-time tracking

**Scenario:**
- User1 shares "current location" with User2
- User1 updates location every 5 minutes (GPS tracking)
- User2 receives updates **1 hour delayed** to prevent stalking

**Implementation approach:**
- Add `propagation_delay` to field policies:
  ```json
  {
    "field": "location.current",
    "scope": "one_to_one",
    "propagation_delay": "1 hour"
  }
  ```
- Scheduled job propagates delayed updates:
  ```sql
  UPDATE shared_card_instances
  SET snapshot_data = ...
  WHERE propagation_delay < NOW()
  ```

**Use cases:**
- Location sharing with safety buffer
- Sensitive health data (share trends, not real-time values)
- Financial data (share monthly summaries, not daily balances)

**Timeline:** Phase 12+ (privacy-focused)

---

## 8. Integration with Existing Systems

### 8.1 Integration with `card_relationships`

**Existing table:** `card_relationships`  
**Purpose:** Manages sharing permissions between users

**Integration points:**

1. **Link shared instances to relationships:**
   ```sql
   relationship_id UUID REFERENCES card_relationships(id) ON DELETE CASCADE
   ```
   - When relationship is revoked, cascade to shared instances
   - Inherit permissions from relationship

2. **Reuse permission structure:**
   ```sql
   -- card_relationships has:
   permissions JSONB  -- e.g., {"view_basic": true, "edit": false}
   
   -- Map to shared_card_instances:
   field_permissions JSONB  -- e.g., {"street": true, "apt": false}
   ```

3. **Relationship lifecycle:**
   - `relationship_type = 'shared'` → creates shared instance
   - `relationship_type = 'revoked'` → sets instance status to 'revoked'
   - Maintains audit trail in both tables

**Code location:** `src/hooks/useConnectionCards.ts` likely handles relationships

---

### 8.2 Integration with `consent_receipts`

**Existing table:** `consent_receipts`  
**Purpose:** Logs user consent for data processing

**Integration points:**

1. **Log initial share as consent:**
   ```sql
   INSERT INTO consent_receipts (
     user_id,  -- owner_user_id
     card_id,  -- original_card_id
     consent_action,
     scope,
     recipients,
     granted_at,
     evidence
   ) VALUES (
     owner_id,
     card_id,
     'share_card',
     'one_to_one',
     ARRAY[recipient_user_id],
     NOW(),
     jsonb_build_object('shared_instance_id', instance_id)
   );
   ```

2. **Log each update propagation:**
   ```sql
   -- In propagate_card_update()
   INSERT INTO consent_receipts (
     user_id,
     card_id,
     consent_action,
     scope,
     recipients,
     evidence
   ) VALUES (
     owner_id,
     card_id,
     'update_shared_data',
     'one_to_one',
     ARRAY[recipient_user_id],
     jsonb_build_object('event_id', event_id, 'field_path', field_path)
   );
   ```

3. **Log reverts as data correction:**
   ```sql
   -- In revert_card_update()
   INSERT INTO consent_receipts (
     user_id,
     consent_action,
     scope,
     evidence
   ) VALUES (
     recipient_user_id,
     'data_correction',
     'one_to_one',
     jsonb_build_object('event_id', event_id, 'reverted_field', field_path)
   );
   ```

**Compliance benefits:**
- Full audit trail for GDPR/CCPA
- Demonstrates user consent for data sharing
- Enables "data subject requests" for transparency

---

### 8.3 Integration with `notification_system`

**Existing hook:** `useNotificationSystem` (src/hooks/useNotificationSystem.ts)  
**Purpose:** Manages in-app notifications

**Integration points:**

1. **Extend notification types:**
   ```typescript
   // Add to existing enum
   type NotificationType = 
     | 'family_invitation'
     | 'relationship_invitation'
     | 'card_update'      // NEW
     | 'card_shared'      // NEW
     | 'card_revoked';    // NEW
   ```

2. **Reuse notification display:**
   ```typescript
   // In NotificationCenter.tsx
   case 'card_update':
     return (
       <CardUpdateNotification
         ownerName={notification.notification_data.owner_name}
         cardLabel={notification.notification_data.card_label}
         changes={notification.notification_data.field_changes}
         revertDeadline={notification.notification_data.revert_deadline}
         onRevert={() => handleRevert(notification.update_event_id)}
       />
     );
   ```

3. **Leverage existing read/unread tracking:**
   - `update_notifications` table has `read_at` column
   - Reuse existing `markAsRead()` function
   - Badge count includes card updates

**Code location:**  
- `src/components/NotificationCenter.tsx` - Display component  
- `src/hooks/useNotificationSystem.ts` - Business logic

---

### 8.4 Integration with Field-Level Policies

**Existing utility:** `src/utils/vcard/policy_engine.ts`  
**Purpose:** Enforces field-level access control based on scope

**Integration points:**

1. **Respect existing `field_policies` in `user_cards`:**
   ```sql
   -- user_cards has:
   field_policies JSONB  -- Array of {path, scope, recipients}
   ```

2. **Filter propagation by policies:**
   ```typescript
   // In propagate_card_update()
   import { filterCardForAudience } from '@/utils/vcard/policy_engine';
   
   const filteredData = filterCardForAudience(
     {
       data: card.data,
       consent: card.consent,
       field_policies: card.field_policies
     },
     {
       viewer_id: recipient_user_id,
       groups: [],  // Future: include family/org groups
       role: 'user'
     }
   );
   ```

3. **Only propagate permitted fields:**
   - If policy says `{path: "address.apt", scope: "private"}`, don't propagate to anyone
   - If policy says `{path: "phone", scope: "one_to_one", recipients: ["user2"]}`, only propagate to user2

4. **Handle permission revocation:**
   ```typescript
   // If field permission is removed, push null update
   if (oldPermissions.has('street') && !newPermissions.has('street')) {
     propagateUpdate({
       field_path: 'data.address.street',
       old_value: current_value,
       new_value: null,
       change_type: 'deleted'
     });
   }
   ```

**Schema reference:** `docs/schemas/policy/field_policy.schema.json`

---

### 8.5 Integration with Merge Engine

**Existing utility:** `src/utils/vcard/merge_engine.ts`  
**Purpose:** Resolves conflicts when multiple card values exist

**Integration points:**

1. **Merge creates update events:**
   - When VCF import detects duplicate person
   - Merge engine creates canonical card
   - If canonical differs from existing shared instances, create update events

2. **Preserve provenance:**
   ```typescript
   // After merge
   const mergedCard = {
     ...canonicalCard,
     provenance: {
       source: 'merge',
       merged_from: [card1.id, card2.id],
       merge_strategy: 'confidence',
       confidence: 0.95
     }
   };
   ```

3. **Propagate merged changes:**
   ```sql
   -- If canonical card becomes "456 Oak Ave" (higher confidence)
   -- and shared instance had "123 Main St"
   -- Create update event showing the merge result
   ```

4. **UI for merge-triggered updates:**
   - Notification: "Your contact was merged with imported data"
   - Show provenance: "Updated from iCloud import (95% confidence)"
   - Allow revert if recipient disagrees with merge

**Reference:** `docs/VCard_Batch2_Analysis.md` sections on Merge Engine

---

## 9. Discussion Notes and Design Rationale

This section captures the key decisions made during architecture discussions.

### 9.1 Key Questions Discussed

#### Q1: Should updates be automatic or require acceptance?

**Answer:** **Automatic updates** with revert option.

**Rationale:**
- Reinforces trust relationship already established
- Reduces friction and cognitive load
- Mirrors real-world behavior (friend tells you they moved, you update automatically)
- Revert option preserves user control
- Exceptions (reverts) should be rare, not the rule

**Alternative considered:** Manual acceptance  
**Why rejected:** Creates notification fatigue, undermines trust model

---

#### Q2: Field-level or card-level granularity?

**Answer:** **Field-level** tracking and revert capability.

**Rationale:**
- Maximum flexibility for users
- User might want new phone number but not new address
- Mirrors real-world selectivity ("I'll update this, but not that")
- Technical complexity is manageable (JSONB field paths)

**Simplification:** "Accept All" button reduces friction for common case

**Alternative considered:** Card-level only  
**Why rejected:** Too coarse-grained, doesn't match user mental model

---

#### Q3: How long to keep version history?

**Answer:** **7-day revert window** for MVP, longer history for reporting.

**Rationale:**
- 7 days sufficient for catching errors
- Balance between user control and system simplicity
- History beyond 7 days maintained for audit, just no revert action
- Configurable per relationship in future phases

**Future enhancement:** Different windows per data type (birthday: 365 days, location: 1 day)

**Alternative considered:** 30 days  
**Why 7 days chosen:** Reduces storage, most errors caught within a week

---

#### Q4: Copy or live-link shared data?

**Answer:** **Copy/snapshot** model.

**Rationale:**
- Simpler RLS (recipient owns their copy)
- Better performance (no cross-user joins)
- Aligns with "contact information" use cases
- Recipient independence (survives owner deletion)
- Enables revert functionality (can't revert someone else's live data)
- Clearer mental model for Normal Human Beings

**Trade-off:** Storage overhead, sync complexity  
**Mitigation:** Efficient JSONB storage, optimized propagation

**Alternative considered:** Live-linked  
**Why rejected:** Complex RLS, incompatible with revert, harder to explain to users

---

#### Q5: How to handle recipient-proposed changes?

**Answer:** **Lightweight "Suggest Correction" button** that opens messaging.

**Rationale:**
- Out of system for MVP keeps it simple
- Leverages existing messaging infrastructure
- Manual review by owner appropriate for MVP
- Avoids complex proposal/approval workflow

**Future enhancement:** In-system proposal workflow with one-click accept/reject

**Alternative considered:** Automatic application of suggestions  
**Why rejected:** Trust model doesn't support recipient editing owner's data (yet)

---

#### Q6: Bulk updates to family units?

**Answer:** **Series of individual updates**, one per member.

**Rationale:**
- Each member independently accepts/reverts
- No consensus mechanism needed
- Aligns with individual autonomy principle
- Front-end uses existing family structures to facilitate sending

**Example:**
- User1 shares address with family of 8
- User1 updates address
- 8 individual update events created (one per member)
- 7 members auto-accept, 1 reverts (independent)

**Alternative considered:** Family-level consensus (majority vote)  
**Why rejected:** Too complex, undermines individual control

---

### 9.2 Design Principles Applied

#### 1. Trust-First
**Principle:** Default to automatic acceptance, builds on established relationship.

**Application:**
- Updates propagate automatically without blocking prompts
- Initial share establishes trust, updates honor that trust
- Revert is safety net, not primary interaction

**Evidence in design:**
- `propagate_card_update()` triggers automatically
- No "Accept Change" button required
- Notifications inform but don't block

---

#### 2. Low-Friction
**Principle:** Minimal user intervention required, notifications not blocking.

**Application:**
- Updates happen in background (async trigger)
- Notifications are informational, not modal dialogs
- "Accept All" button reduces clicks
- Most common path (accept update) requires zero clicks

**Evidence in design:**
- No confirmation dialogs for propagation
- Revert is opt-in, not default
- Notification center, not popup alerts

---

#### 3. Transparency
**Principle:** Full change history and audit trail always available.

**Application:**
- Every change logged in `card_update_events`
- Complete timeline visible in reports
- Consent receipts for compliance
- Provenance metadata preserved

**Evidence in design:**
- `card_update_events` never deleted (soft delete only)
- Change report with unlimited history
- Audit logs for all actions

---

#### 4. User Control
**Principle:** Revert option preserves autonomy within trust framework.

**Application:**
- 7-day revert window
- Field-level granularity (partial revert)
- Clear deadline display
- No judgment for reverting

**Evidence in design:**
- `revert_card_update()` function always available within window
- Revert tracked but not penalized
- UI makes revert easy to find

---

#### 5. Simplicity
**Principle:** Copy/snapshot model easier to understand than live-linked.

**Application:**
- "You shared this with me, now I have a copy"
- Simpler RLS (recipient owns data)
- Clearer mental model for NHBs

**Evidence in design:**
- `shared_card_instances` stores complete copy
- No complex cross-user RLS policies
- UI shows "Your copy of Mike's address"

---

#### 6. Scalability
**Principle:** Design supports future AI-Agent and complex relationship scenarios.

**Application:**
- JSONB for flexible metadata
- Extensible notification types
- Field-level policy integration ready
- Room for advanced relationship types

**Evidence in design:**
- `notification_data` JSONB (any payload)
- `field_permissions` JSONB (future scopes)
- Hooks for merge engine, policy engine

---

#### 7. Compliance
**Principle:** Consent and audit logging built in from start.

**Application:**
- Integration with `consent_receipts`
- GDPR-ready audit trail
- Data subject request support
- Provenance tracking

**Evidence in design:**
- Every share logged as consent
- Every update logged for audit
- Data retention policies respected

---

### 9.3 MVP Scope Boundaries

#### In Scope (MVP - Phases 1-6)

✅ **Core Functionality:**
- Automatic update propagation
- 7-day revert window with field-level granularity
- In-app notifications
- Basic change reports (date, entity, status filters)
- Suggest correction button (opens messaging)
- Copy/snapshot data model

✅ **Security:**
- RLS policies for all tables
- SECURITY DEFINER functions
- Audit logging
- Consent receipt integration

✅ **User Experience:**
- Notification center integration
- Revert dialog with field selection
- Change timeline view
- Family unit bulk sharing

---

#### Out of Scope (Future Phases)

❌ **Communication:**
- Email/SMS notifications (in-app only for MVP)
- Push notifications
- Digest emails

❌ **Advanced Features:**
- Configurable revert windows (7 days hardcoded)
- Advanced relationship-based update policies
- Two-way synchronization (collaborative editing)
- Real-time WebSocket updates (batch/polling for MVP)
- AI-Agent specific features
- Automatic application of recipient suggestions

❌ **Optimization:**
- Advanced caching strategies
- Read replicas for reporting
- Archive partitioning for old events

❌ **Analytics:**
- Revert rate analytics dashboard
- Trust score based on acceptance patterns
- Anomaly detection (unusual revert patterns)

---

## 10. Monitoring and Metrics

### 10.1 Key Metrics to Track

**Business Metrics:**
1. **Share creation rate:** New `shared_card_instances` per day/week
2. **Update propagation count:** `card_update_events` created per day
3. **Revert rate:** % of updates reverted (target: < 5%)
4. **Time to revert:** Average hours from propagation to revert (indicates confidence)
5. **Notification engagement:** % of notifications clicked vs. dismissed
6. **Suggestion usage:** "Suggest Correction" clicks per user

**Technical Metrics:**
1. **Propagation latency:** Time from card update to snapshot update (target: < 1s)
2. **Query performance:** Change report load time (target: < 2s)
3. **Database growth:** JSONB snapshot_data size over time
4. **Function execution time:** `propagate_card_update()` duration

**User Experience Metrics:**
1. **Active shared instances:** How many users have active shares?
2. **Average shared instance lifespan:** How long do shares last?
3. **Bulk sharing adoption:** % of shares to family units vs. individuals
4. **Revert window expiry:** % of updates that reach 7 days without revert (indicates trust)

### 10.2 Monitoring Implementation

**Database queries:**
```sql
-- Daily metrics
CREATE VIEW v_daily_sharing_metrics AS
SELECT 
  DATE(created_at) AS date,
  COUNT(*) FILTER (WHERE notification_type = 'card_shared') AS new_shares,
  COUNT(*) FILTER (WHERE notification_type = 'card_update') AS updates,
  COUNT(*) FILTER (WHERE notification_type = 'card_revoked') AS revocations
FROM update_notifications
GROUP BY DATE(created_at);

-- Revert rate
CREATE VIEW v_revert_metrics AS
SELECT 
  DATE(event_timestamp) AS date,
  COUNT(*) AS total_events,
  COUNT(*) FILTER (WHERE reverted) AS reverted_events,
  ROUND(100.0 * COUNT(*) FILTER (WHERE reverted) / COUNT(*), 2) AS revert_percentage
FROM card_update_events
GROUP BY DATE(event_timestamp);
```

**Alerting rules:**
- Revert rate > 15% (indicates trust issues or bugs)
- Propagation latency > 5s (performance degradation)
- Failed propagations > 1% (trigger/function errors)

### 10.3 Performance Considerations

**Indexes:**
```sql
-- Recipient queries (most common)
CREATE INDEX idx_shared_instances_recipient_status 
  ON shared_card_instances(recipient_user_id, status);

-- Change reports
CREATE INDEX idx_update_events_timestamp 
  ON card_update_events(event_timestamp DESC);

-- Revert window queries
CREATE INDEX idx_update_events_revert_window 
  ON card_update_events(revert_window_expires_at) 
  WHERE NOT reverted;
```

**Partitioning (future):**
```sql
-- Partition card_update_events by month for large datasets
CREATE TABLE card_update_events_2025_11 
  PARTITION OF card_update_events 
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
```

**Archival strategy:**
```sql
-- Move events older than 90 days to archive table
CREATE TABLE card_update_events_archive (
  LIKE card_update_events INCLUDING ALL
);

-- Nightly job
INSERT INTO card_update_events_archive
SELECT * FROM card_update_events
WHERE event_timestamp < NOW() - INTERVAL '90 days';

DELETE FROM card_update_events
WHERE event_timestamp < NOW() - INTERVAL '90 days';
```

**Query optimization:**
```sql
-- Materialized view for reports (refresh hourly)
CREATE MATERIALIZED VIEW mv_user_change_summary AS
SELECT 
  recipient_user_id,
  DATE_TRUNC('day', event_timestamp) AS day,
  COUNT(*) AS total_changes,
  COUNT(*) FILTER (WHERE reverted) AS reverted_changes,
  COUNT(DISTINCT shared_instance_id) AS affected_cards
FROM card_update_events
GROUP BY recipient_user_id, DATE_TRUNC('day', event_timestamp);

CREATE INDEX ON mv_user_change_summary(recipient_user_id, day DESC);
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

**Database functions:**
```sql
-- Test create_shared_instance()
BEGIN;
  SELECT create_shared_instance(
    'card_123'::uuid,
    'user_456'::uuid,
    '{"street": true, "apt": false}'::jsonb
  );
  
  -- Assert: Instance created with correct permissions
  SELECT assert(
    (SELECT field_permissions->'street' = 'true'::jsonb 
     FROM shared_card_instances 
     WHERE recipient_user_id = 'user_456'),
    'Field permissions not set correctly'
  );
ROLLBACK;

-- Test revert_card_update()
BEGIN;
  -- Create event
  INSERT INTO card_update_events (...) VALUES (...);
  
  -- Revert
  SELECT revert_card_update('event_123'::uuid, 'user_456'::uuid, NULL);
  
  -- Assert: Event marked as reverted
  SELECT assert(
    (SELECT reverted FROM card_update_events WHERE id = 'event_123'),
    'Event not marked as reverted'
  );
ROLLBACK;
```

**RLS policies:**
```sql
-- Test recipient isolation
SET SESSION AUTHORIZATION user_1;
SELECT COUNT(*) FROM shared_card_instances;  -- Should see only own instances

SET SESSION AUTHORIZATION user_2;
SELECT COUNT(*) FROM shared_card_instances;  -- Should see different instances

-- Assert: No overlap
```

### 11.2 Integration Tests

**Share → Update → Notify flow:**
```typescript
test('User1 shares card, updates it, User2 receives notification', async () => {
  // 1. User1 shares
  const instanceId = await createSharedInstance(card.id, user2.id);
  
  // 2. User1 updates
  await updateCard(card.id, { street: '456 Oak Ave' });
  
  // 3. User2 queries notifications
  const notifications = await fetchNotifications(user2.id);
  
  // Assertions
  expect(notifications).toHaveLength(2);  // Share + Update
  expect(notifications[1].notification_type).toBe('card_update');
  expect(notifications[1].notification_data.field_changes[0].new).toBe('456 Oak Ave');
});
```

**Revert flow:**
```typescript
test('User2 can revert update within window', async () => {
  // Setup: Create shared instance and update event
  const event = await createUpdateEvent();
  
  // User2 reverts
  const result = await revertCardUpdate(event.id, user2.id);
  
  // Assertions
  expect(result.success).toBe(true);
  
  // Check snapshot restored
  const instance = await fetchSharedInstance(instanceId);
  expect(instance.snapshot_data.data.address.street).toBe('123 Main St');  // Old value
});
```

**Bulk sharing:**
```typescript
test('Share with family creates instance for each member', async () => {
  const familyMembers = [user2, user3, user4];
  
  // Share with family
  await shareWithFamily(card.id, family.id);
  
  // Assertions
  for (const member of familyMembers) {
    const instance = await fetchSharedInstance(card.id, member.id);
    expect(instance).toBeDefined();
  }
});
```

### 11.3 End-to-End Tests

**Full lifecycle:**
```typescript
test('Complete sharing lifecycle', async () => {
  // 1. Initial share
  await user1.shareCard('Home Address', user2);
  await user2.verifyCardAppears('Home Address');
  
  // 2. Update
  await user1.updateCard('Home Address', { street: '456 Oak Ave' });
  await user2.verifyNotification('Mike Kirkland updated their Home Address');
  await user2.verifyCardUpdated('Home Address', { street: '456 Oak Ave' });
  
  // 3. Revert
  await user2.clickRevertButton();
  await user2.selectField('street');
  await user2.confirmRevert();
  await user2.verifyCardUpdated('Home Address', { street: '123 Main St' });
  
  // 4. Change report
  await user2.openChangeReport();
  await user2.verifyChangeHistory([
    { field: 'street', old: '123 Main', new: '456 Oak', status: 'reverted' }
  ]);
});
```

**Error scenarios:**
```typescript
test('Revert fails after window expiry', async () => {
  // Create event 8 days ago
  const event = await createUpdateEvent({ days_ago: 8 });
  
  // Attempt revert
  const result = await user2.attemptRevert(event.id);
  
  // Assertion
  expect(result.error).toBe('Revert window expired');
  expect(user2.screen.queryByText('Revert')).toBeNull();  // Button hidden
});
```

### 11.4 Performance Tests

**Bulk propagation:**
```typescript
test('Propagate to 100 recipients completes in < 5s', async () => {
  // Create 100 shared instances
  const recipients = createUsers(100);
  for (const user of recipients) {
    await shareCard(card.id, user.id);
  }
  
  // Measure propagation time
  const startTime = Date.now();
  await updateCard(card.id, { street: 'New Address' });
  const duration = Date.now() - startTime;
  
  // Assertion
  expect(duration).toBeLessThan(5000);
  
  // Verify all recipients got event
  const eventCount = await countUpdateEvents(card.id);
  expect(eventCount).toBe(100);
});
```

**Query performance:**
```typescript
test('Change report with 1000 events loads in < 2s', async () => {
  // Create 1000 events
  await createUpdateEvents(1000);
  
  // Measure query time
  const startTime = Date.now();
  const report = await fetchChangeReport(user.id, { limit: 50 });
  const duration = Date.now() - startTime;
  
  // Assertion
  expect(duration).toBeLessThan(2000);
  expect(report.events).toHaveLength(50);  // Paginated
});
```

---

## 12. Documentation and Training

### 12.1 User Documentation

**Guides to create:**

1. **"Understanding Shared Cards" Guide**
   - What is a shared card?
   - How sharing works (snapshot model explained)
   - What happens when the owner updates?
   - How to revert changes
   - How to view change history

2. **"How to Revert Changes" Tutorial**
   - Step-by-step with screenshots
   - Field-level revert explanation
   - Revert window countdown
   - What happens after revert expires

3. **"Managing Notifications" FAQ**
   - What notifications will I receive?
   - How to mark as read/dismiss
   - How to view older notifications
   - Can I turn off notifications? (future feature)

4. **Video Walkthrough**
   - 3-minute overview of reciprocal sharing
   - Demonstrates: share → update → notify → revert
   - Shows family unit scenario

### 12.2 Developer Documentation

**Technical docs to create:**

1. **Database Schema Reference**
   - Table structures (this document sections 4.1-4.3)
   - RLS policies explained
   - Indexes and performance considerations
   - Migration guide

2. **Function API Reference**
   - `create_shared_instance()` parameters and return values
   - `propagate_card_update()` trigger behavior
   - `revert_card_update()` usage examples
   - Error handling

3. **Integration Guide for New Card Types**
   - How to make a new card type "shareable"
   - Field permission mapping
   - Notification customization
   - Testing checklist

4. **Architecture Decision Records (ADRs)**
   - Why copy/snapshot over live-linked
   - Why 7-day revert window
   - Why field-level granularity
   - Why automatic propagation

### 12.3 Onboarding Materials

**For new developers:**
- Architecture overview diagram (tables + flows)
- Code walkthrough video (15 minutes)
- Common queries and patterns
- Debugging tips (how to trace propagation)

**For product managers:**
- Trust-first model explanation
- User flow diagrams
- Metrics dashboard tour
- Feature roadmap (phases 1-6+)

---

## 13. Conclusion

The Reciprocal Sharing Architecture represents a thoughtful balance between **trust** and **control**, **automation** and **autonomy**, **simplicity** and **power**.

### 13.1 Core Achievement

By implementing a **trust-first, automatic update model** with low-friction revert capabilities, we:
- Simplify the complex data sharing that Normal Human Beings naturally perform in the physical world
- Reinforce trust relationships through seamless information flow
- Preserve user autonomy through transparent change history and revert options
- Build a foundation that scales from simple contact sharing to sophisticated AI-agent interactions

### 13.2 Strategic Foundation

The copy/snapshot model with pushed updates provides:
- **Simplicity:** Clear mental model for users and developers
- **Security:** Strong RLS isolation with SECURITY DEFINER functions
- **Scalability:** Handles family units, bulk sharing, and future enhancements
- **Flexibility:** JSONB structures enable field-level policies and complex metadata

### 13.3 Phased Implementation Path

The 6-phase rollout (Weeks 1-12) delivers:
- **Phase 1-2:** Core infrastructure and automatic propagation
- **Phase 3-4:** User control through reverts and reporting
- **Phase 5-6:** Enhancement features and bulk operations

Each phase delivers **tangible user value** while building toward the complete vision.

### 13.4 Future-Ready Design

The architecture accommodates future needs:
- **AI-Agent integration:** Field policies and consent receipts ready
- **Advanced relationships:** Update policies extensible
- **Real-time sync:** WebSocket integration path clear
- **Differential privacy:** Propagation delay hooks available

### 13.5 Alignment with Opn2 Vision

This architecture directly supports Opn2's mission:
- **Trust relationships:** Automatic propagation reinforces established trust
- **User empowerment:** Field-level control, transparent history
- **Complexity simplified:** Physical-world metaphors, clear UX
- **Privacy-first:** Consent receipts, audit trails, user-owned snapshots

### 13.6 Next Steps

**Immediate actions:**
1. ✅ **Review and approve** this architecture document
2. 🔨 **Database migration** for three new tables (Phase 1)
3. 🧪 **RLS policy testing** to validate security model
4. 💻 **Implement** `create_shared_instance()` function
5. 🎨 **UI wireframes** for share flow and notifications
6. 👥 **Stakeholder alignment** on trust-first model

**Success criteria for MVP (Phase 6 completion):**
- Users can share cards with individuals and family units
- Updates propagate automatically within 1 second
- Recipients receive in-app notifications
- Recipients can revert changes within 7 days
- Change reports provide full audit trail
- Suggest correction opens messaging with context

**Long-term vision:**
- Extend to AI-agent sharing (Phase 7+)
- Implement relationship-based policies (Phase 8+)
- Enable collaborative editing (Phase 10+)
- Integrate with vCard merge engine (Phase 11+)

---

## Appendices

### Appendix A: Related Documentation

- `docs/Opnli_Cards_Architecture_MVP.md` - Overall card system architecture
- `docs/VCard_Integration_Feasibility_Analysis.md` - vCard import analysis
- `docs/VCard_Batch2_Analysis.md` - Policy and merge engine details
- `docs/schemas/policy/field_policy.schema.json` - Field policy schema
- `src/utils/vcard/policy_engine.ts` - Field-level policy implementation
- `src/utils/vcard/merge_engine.ts` - Conflict resolution logic

### Appendix B: SQL Schema Quick Reference

```sql
-- Core tables
shared_card_instances (id, original_card_id, recipient_user_id, snapshot_data, status)
card_update_events (id, shared_instance_id, field_path, old_value, new_value, reverted)
update_notifications (id, update_event_id, recipient_user_id, notification_type, read_at)

-- Core functions
create_shared_instance(card_id, recipient_id, permissions) → instance_id
propagate_card_update() → trigger (automatic)
revert_card_update(event_id, user_id, fields[]) → success/error
revoke_shared_instance(instance_id, owner_id) → boolean
```

### Appendix C: Glossary

- **Snapshot:** Copy of card data at time of sharing, stored in recipient's space
- **Propagation:** Automatic push of updates from owner to all shared instances
- **Revert:** Recipient action to restore old value of a field within 7-day window
- **Revert window:** Time period during which revert is allowed (default: 7 days)
- **Shared instance:** Single copy of a shared card owned by a specific recipient
- **Update event:** Record of a single field change propagated to a shared instance
- **Field path:** JSONPath-style string identifying a specific field (e.g., "data.address.street")
- **Trust-first model:** Design philosophy of automatic acceptance with opt-out (revert)
- **Copy/snapshot model:** Architecture where shared data is copied vs. live-linked

### Appendix D: Contact for Questions

**Architecture questions:** Review this document, then ask in #dev-architecture  
**Implementation questions:** Check Phase 1-6 sections, then ask in #dev-backend  
**UX questions:** See sections 3.1-3.5, then ask in #product-design

---

**Document status:** ✅ Ready for Review  
**Next review date:** After Phase 1 completion  
**Document owner:** Architecture Team  
**Last updated:** 2025-11-01
