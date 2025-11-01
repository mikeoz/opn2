# Opn2 Family Invitation System - Test Plan & Evaluation

## Overview
This document provides a comprehensive test plan for evaluating the Opn2 relationship and family invitation system, with specific focus on Role Level Security (RLS) compliance.

---

## Transaction Model Evaluations

### 1. New Individual User Registration (Navigate to /login and create account)

**Status: PS (Partially Supported)**

**Current Implementation:**
- Login page (`/login`) provides a "Don't have an account? Sign up" link that navigates to `/register`
- Registration is handled on a separate page (`/register`), not directly on `/login`
- Registration form includes:
  - Email and password fields
  - Account type selection (individual/organization)
  - Proper form validation
  - Supabase authentication integration
  - Automatic profile creation via database trigger

**Issues Identified:**
1. **Navigation Required**: Users must click a link to navigate from `/login` to `/register`, rather than having signup available directly on the `/login` page
2. **User Expectation Mismatch**: The requirement states users should "navigate to /login and create a new account" but signup is on a different route

**RLS Compliance:** ✅ **COMPLIANT**
- `profiles` table has proper RLS policies
- `handle_new_user()` trigger function uses `security definer` to safely create profiles
- User roles are assigned correctly for organization accounts

**Next Steps:**
- **Option A**: Update documentation to clarify that signup is at `/register`
- **Option B**: Add an inline signup toggle on `/login` page to allow account creation without navigation
- **Recommendation**: Option A is sufficient; standard practice is separate login/register pages

---

### 2. Existing User Login (Navigate to /login and sign in)

**Status: FS (Fully Supported)**

**Current Implementation:**
- Complete login form with email and password fields
- Proper error handling and user feedback via toast notifications
- Session management with automatic redirect to `/dashboard` on success
- Auth state cleanup before login to prevent session conflicts
- Loading states to provide user feedback during authentication

**RLS Compliance:** ✅ **COMPLIANT**
- Uses Supabase `auth.uid()` for RLS policy enforcement
- No direct manipulation of auth tables from client
- Proper session token management

**Test Steps:**
1. Navigate to `/login`
2. Enter valid email and password
3. Click "Sign In" button
4. Verify redirect to `/dashboard`
5. Verify user session is established

**Expected Behavior:** ✅ All working as designed

---

### 3. Password Reset (Forgot password flow)

**Status: FS (Fully Supported)**

**Current Implementation:**
- "Forgot your password?" link on `/login` page
- Toggle to reset mode showing email-only form
- Uses Supabase `resetPasswordForEmail()` with proper redirect URL
- Success/error feedback via toast notifications
- "Back to Sign In" option to return to login form

**RLS Compliance:** ✅ **COMPLIANT**
- Password reset handled entirely by Supabase Auth service
- No direct database manipulation
- Secure token-based reset flow

**Test Steps:**
1. Navigate to `/login`
2. Click "Forgot your password?"
3. Enter email address
4. Click "Send Reset Email"
5. Check development console for password reset link (in production, check email)
6. Follow link to reset password
7. Verify ability to log in with new password

**Expected Behavior:** ✅ All working as designed

---

### 4. Family Invitation Flow (Complete end-to-end family member invitation)

**Status: PS (Partially Supported)**

**Current Implementation Analysis:**

#### 4.1 User1 Sends Invitation (Sender Side)
✅ **Working Components:**
- User1 can navigate to `/family-management`
- Family detail view shows "Invitations" tab
- "Add Family Member" button available for family owners
- `UnifiedFamilyAddDialog` component handles invitation creation
- Form includes: name, email, relationship, and optional message
- Backend edge function `send-family-invitation` creates invitation and sends email
- Console log provides invitation link for development testing

#### 4.2 User2 Receives and Accepts Invitation (Recipient Side)
✅ **Working Components:**
- Invitation link includes unique `invitationToken` parameter
- `/register` page detects invitation token in URL
- System checks if User2 already has an account:
  - If yes: Switches to sign-in mode
  - If no: Shows registration form pre-filled with invitation data
- After authentication, `handleInvitationAcceptance()` calls edge function
- Edge function `accept-family-invitation` validates token and creates membership

#### 4.3 Post-Acceptance View (CRITICAL ISSUE IDENTIFIED)
❌ **Issue Found - Incomplete Feature:**

**What Should Happen:**
- User1 should see User2 as an active family member in their family unit
- User2 should see User1's family in their `/family-management` view under "Member Of" section

**What Actually Happens:**
The code DOES support showing families where user is a member:
```typescript
// Lines 374-396 in FamilyManagement.tsx
{familyUnits.filter(f => f.isMember && !f.isOwner).length > 0 && (
  <div className="space-y-3">
    <Badge variant="secondary">Member Of</Badge>
    {/* Shows families where user is a member but not owner */}
  </div>
)}
```

**Root Cause Analysis:**

1. **Database Query Issue**: The `useFamilyUnits` hook needs to verify it properly queries:
   - Families where `trust_anchor_user_id = current_user` (owned families)
   - Families where current user has membership via `organization_memberships` table

2. **RLS Policy Verification Needed**: 
   - `family_units` table has policy: "Users can view family units they are trust anchor of or members"
   - `organization_memberships` table has policy: "Users can view their own memberships"
   - Need to verify the join query respects both policies

3. **Membership Enrichment**: The `fetchFamilyUnits` function enriches family data with:
   ```typescript
   // Check if current user is a member of this family
   const { data: membershipData } = await supabase
     .from('organization_memberships')
     .select('*')
     .eq('organization_user_id', trustAnchorId)
     .eq('individual_user_id', user.id)
     .eq('is_family_unit', true)
     .eq('status', 'active')
     .single();
   ```

**RLS Compliance Issues:**
⚠️ **POTENTIAL ISSUE**
- The family member addition might not be properly creating the `organization_memberships` record
- The RLS policies on `organization_memberships` may be blocking the view
- The `accept-family-invitation` edge function needs verification

**Next Steps to Fix:**

1. **Verify Edge Function Logic**: Check `accept-family-invitation/index.ts` ensures:
   ```sql
   INSERT INTO organization_memberships (
     individual_user_id,
     organization_user_id,
     is_family_unit,
     status,
     relationship_label
   ) VALUES (
     [user_id],           -- The accepting user (User2)
     [trust_anchor_id],   -- The family trust anchor (User1)
     true,
     'active',
     [relationship_label]
   )
   ```

2. **Add Logging**: Insert debug logs in `useFamilyUnits` to verify:
   - All families are being fetched
   - Membership checks are working
   - `isMember` flag is being set correctly

3. **Test RLS Policies**: Verify policies allow:
   - User2 to see `organization_memberships` records where `individual_user_id = User2.id`
   - User2 to see `family_units` where they have a membership record

4. **UI Verification**: After acceptance, User2 should:
   - See a "Member Of" section with User1's family
   - Be able to click on the family card
   - View family details in read-only mode

---

## Detailed Test Plan for Transaction #4

### Prerequisites
- User1 exists with an active family unit called "Smith Family"
- User2 email: `user2@example.com` (does NOT have an account yet)

### Test Steps

#### Phase 1: User1 Sends Invitation
1. Log in as User1
2. Navigate to `/family-management`
3. Click on "Smith Family" card to select it
4. Click on "Invitations" tab
5. Click "Add Family Member" button
6. Fill out form:
   - Name: "Jane Doe"
   - Email: "user2@example.com"
   - Relationship: "Daughter"
   - Message: "Welcome to the family!"
7. Click "Send Invitation"
8. **Expected Result**: Success toast + console log with invitation link

#### Phase 2: User2 Account Creation & Acceptance
9. Copy invitation link from console log
10. Open link in incognito window
11. **Expected Result**: Register page with invitation banner showing:
    - Family name: "Smith Family"
    - Invited by: "User1 Name"
    - Relationship: "Daughter"
12. Fill out registration form:
    - First Name: "Jane"
    - Last Name: "Doe"
    - Password: (strong password)
13. Click "Create Account and Accept Invitation"
14. **Expected Result**: 
    - Success toast
    - Redirect to `/dashboard`

#### Phase 3: Verification - User2 View
15. While logged in as User2, navigate to `/family-management`
16. **Expected Result**: 
    - Should see "Member Of" section
    - Should see "Smith Family" card under "Member Of"
    - Card should show:
      - Family name
      - "Member" badge
      - Generation level
      - Your relationship: "Daughter"
17. Click on "Smith Family" card
18. **Expected Result**:
    - View family details in read-only mode
    - See all active family members
    - Cannot edit family settings (not owner)

#### Phase 4: Verification - User1 View
19. Log back in as User1
20. Navigate to `/family-management`
21. Click on "Smith Family"
22. Click "Members" tab
23. **Expected Result**:
    - Should see "Jane Doe" listed as active member
    - Relationship: "Daughter"
    - Status: "Active"

#### Phase 5: Edge Case Testing
24. Test with existing user (User3 who already has account):
    - Send invitation to User3's email
    - Click invitation link
    - **Expected**: Should show sign-in form instead of registration
    - Sign in as User3
    - **Expected**: Invitation automatically accepted, redirect to dashboard

---

## RLS Security Verification Checklist

### Tables to Verify
- [ ] `family_units`: User2 can SELECT families they're members of
- [ ] `organization_memberships`: User2 can SELECT their own memberships
- [ ] `family_invitations`: Proper INSERT/UPDATE policies for accepting invitations
- [ ] `profiles`: User lookup by email works for invitation checks

### Edge Functions Security
- [ ] `send-family-invitation`: Verifies sender owns the family unit
- [ ] `accept-family-invitation`: Validates token, prevents duplicate memberships
- [ ] Both functions use `SUPABASE_SERVICE_ROLE_KEY` for privileged operations

---

## Known Issues & Recommendations

### Issue #1: Member View Not Showing
**Severity**: HIGH  
**Impact**: Core feature not working  
**Status**: Needs investigation

**Recommended Fix**:
1. Add comprehensive logging to `useFamilyUnits.fetchFamilyUnits()`
2. Verify `accept-family-invitation` edge function creates membership correctly
3. Test RLS policies manually using SQL queries
4. Add real-time subscription to refresh family list after invitation acceptance

### Issue #2: No Invitation Status Tracking
**Severity**: MEDIUM  
**Impact**: User cannot see pending invitations sent to them  
**Status**: Enhancement needed

**Recommended Addition**:
- Add "Pending Invitations" section to User2's dashboard
- Show invitations where `invitee_email = User2.email` and `status = 'pending'`
- Allow User2 to accept/reject from dashboard without needing email link

### Issue #3: No Real-time Updates
**Severity**: LOW  
**Impact**: User must refresh to see new members  
**Status**: Enhancement opportunity

**Recommended Addition**:
- Add Supabase real-time subscriptions to `family_units` and `organization_memberships`
- Auto-refresh family list when changes occur

---

## Summary

| Transaction | Status | RLS Compliant | Priority |
|-------------|--------|---------------|----------|
| 1. New User Signup | PS | ✅ Yes | Medium |
| 2. User Login | FS | ✅ Yes | N/A |
| 3. Password Reset | FS | ✅ Yes | N/A |
| 4. Family Invitation Flow | PS | ⚠️ Needs Verification | **HIGH** |

**Overall Assessment**: The system has all the core components in place, but Transaction #4 requires debugging to ensure the "Member Of" view properly displays families where the user is a member. The RLS policies appear correct but need runtime verification to ensure they're not blocking legitimate queries.

**Immediate Action Items**:
1. Add logging to verify membership creation in `accept-family-invitation`
2. Test User2's ability to query families via `organization_memberships`
3. Verify the `isMember` flag is being set correctly in `useFamilyUnits`
4. Create end-to-end test following the detailed test plan above
