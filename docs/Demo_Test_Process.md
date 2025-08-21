# Demo/Test Process Guide

## Family Management Demo Flow

### Current Demo Status
The system is in **DEVELOPMENT MODE** which means:
- ✅ Email invitations are logged to console instead of actually sent
- ✅ All invitation functionality works without real email delivery  
- ✅ Perfect for testing and demonstrations
- ✅ No external email service dependencies

### Standard Demo Personas

#### Primary Family (Robert Johnson - Trust Anchor)
- **Email**: robert.johnson@testco.com
- **Role**: Trust anchor of "Johnson Family Unit"
- **Already Created**: ✅

#### Demo Invitees (Use these for consistent testing)

1. **Mary Johnson** (Spouse)
   - Email: `mary.johnson@testco.com`
   - Relationship: `spouse`
   - Message: "Join our family unit!"

2. **Sarah Johnson** (Child)  
   - Email: `sarah.johnson@testco.com`
   - Relationship: `child`
   - Message: "Welcome to the family!"

3. **Michael Johnson** (Child)
   - Email: `michael.johnson@testco.com`  
   - Relationship: `child`
   - Message: "You're part of our family!"

4. **David Johnson** (Parent)
   - Email: `david.johnson@testco.com`
   - Relationship: `parent`
   - Message: "Let's connect our families!"

### Demo Test Workflow

#### 1. Send Family Invitations
1. Navigate to `/family-management`
2. Click "Add Family Member" 
3. Use demo personas above
4. Submit invitation
5. ✅ **Expected**: Success message + console logs (check dev tools)

#### 2. Check Invitation Status
1. View "Pending Invitations" tab
2. ✅ **Expected**: See new invitations listed
3. Click "Resend" to test resending functionality
4. ✅ **Expected**: Resend works without errors

#### 3. Test Edge Cases
- **Duplicate Invitations**: Try same email twice
  - ✅ **Expected**: Smart handling (reactivates cancelled/expired)
- **Invalid Emails**: Try malformed email addresses  
  - ✅ **Expected**: Proper validation errors
- **Network Issues**: Simulated by edge function failures
  - ✅ **Expected**: Graceful error handling

### Development Mode Benefits

1. **No Email Dependencies**: Works without Resend API keys
2. **Full Logging**: All invitation details logged to console  
3. **Instant Testing**: No waiting for email delivery
4. **Complete URLs**: Invitation URLs available in console logs
5. **Reliable Demo**: Consistent behavior for presentations

### Production Mode Transition

When ready for production:
1. Set `DEVELOPMENT_MODE = false` in `email-family-invitation` function
2. Configure `RESEND_API_KEY` secret in Supabase
3. Verify domain setup in Resend dashboard
4. Test with real email addresses

### Troubleshooting Demo Issues

#### "Failed to send invitation email"
- ✅ **Normal in development**: Check console for logged email details
- 🔍 **Debugging**: Open browser dev tools → Console tab
- 📧 **What to look for**: "📧 DEVELOPMENT MODE - Email would be sent:"

#### "No pending invitations" 
- 🔍 **Check**: Database directly via Supabase dashboard
- 🔧 **Fix**: Use "Resend" button to reactivate invitations

#### Edge function errors
- 🔍 **Check**: Supabase Functions logs in dashboard
- 🔧 **Common fix**: Network connectivity issues in sandbox environment

### Demo Script Template

```
"Let me demonstrate the family invitation system:

1. I'll invite Mary Johnson as my spouse
   [Fill form, submit]
   
2. Notice the success message - in development mode, 
   the email is logged to console instead of sent
   
3. Check the pending invitations tab - there's Mary's invitation
   
4. I can resend invitations or cancel them as needed
   
5. In production, Mary would receive a real email with 
   a registration link to join the family unit."
```

## Next Development Priorities

1. ✅ Family invitation system (COMPLETE)
2. 🔄 Family connection system (IN PROGRESS)  
3. 📅 Card sharing between family members
4. 📅 Family tree visualization
5. 📅 Bulk import system integration