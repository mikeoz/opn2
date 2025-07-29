# Admin User Guide - Opnli Community Directory

## Overview
This guide explains how admin users can access and utilize the administrative functions in the Opnli Community Directory system.

## Admin Access Requirements

### Who Gets Admin Rights
- **Organization Account Creators**: Users who register with a non-individual (organization) account automatically receive admin privileges
- **Manually Assigned Admins**: Existing admins can assign admin rights to other users through the organization management system

### Account Types and Admin Rights
- **Individual Account with Admin Rights**: Can access admin functions but cannot create templates or manage organization features
- **Organization Account with Admin Rights**: Full access to all admin features including template creation, bulk import, and organization management

## Accessing Admin Functions

### Navigation
Once logged in as an admin user, you'll see additional navigation icons in the top header:

1. **Settings Icon (⚙️)**: Links to `/admin/cards` - Admin Card Management
2. **Upload Icon (📤)**: Links to `/admin/bulk-import` - Bulk Import Manager

### Admin Pages

#### 1. Admin Cards Management (`/admin/cards`)
**Purpose**: Manage card templates and system configuration

**Features Available**:
- **Template Creation**: Create new admin-level card templates (Organization accounts only)
- **Template Management**: View, edit, and delete existing admin templates
- **Bulk Import Manager**: Access to bulk card import functionality (Organization accounts only)
- **Organization Management**: Manage organization members and their roles (Organization accounts only)

**Access Requirements**:
- Admin role required
- Some features limited to organization accounts

#### 2. Bulk Import Manager (`/admin/bulk-import`)
**Purpose**: Import multiple cards using CSV templates

**Features Available**:
- **CSV Template Upload**: Upload spreadsheet files with card data
- **Template Selection**: Choose which card template to use for import
- **Progress Tracking**: Monitor import job status
- **Error Reporting**: View detailed error logs for failed imports

**Access Requirements**:
- Admin role required
- Will show "Access Denied" message for non-admin users

## How to Use Admin Functions

### Creating Card Templates
1. Navigate to `/admin/cards` using the Settings icon (⚙️)
2. Click "Create New Admin Template" button (Organization accounts only)
3. Configure template fields and settings
4. Save the template for use across the system

### Bulk Importing Cards
1. Navigate to `/admin/bulk-import` using the Upload icon (📤)
2. Select the card template to use for import
3. Upload your CSV file with card data
4. Monitor the import progress
5. Review any errors or failed imports

### Managing Organization Members
1. Navigate to `/admin/cards`
2. Scroll to the "Organization Management" section
3. Invite new members by email
4. Assign admin or member roles
5. Remove members when necessary

## Account Type Display

### Profile Information
Your profile will show:
- **Role**: "Admin" (if you have admin privileges)
- **Account Type**: 
  - "Individual" (personal account with admin rights)
  - "Organization" (organization account with admin rights)
- **Organization Name**: Displayed for organization accounts

### Mixed Individual/Organization Access
If you are both an individual user and an admin for an organization:
- Account type should display as "Individual/Organization"
- Organization name should be shown for the organization you admin
- You'll have access to all admin functions

## Troubleshooting

### "Access Denied" Messages
If you see "Access Denied" when trying to access admin functions:
1. Verify you have admin role in your profile
2. Contact an existing admin to assign admin rights
3. For organization features, ensure your account type is "non_individual"

### Missing Navigation Icons
If you don't see the admin navigation icons:
1. Refresh the page to reload your permissions
2. Log out and log back in to refresh your session
3. Contact support if the issue persists

### Template Creation Limitations
If you can't create templates:
- Template creation is only available for organization accounts
- Individual accounts with admin rights can view and manage existing templates but cannot create new ones

## Security Notes
- All admin actions are logged and audited
- Admin role changes are tracked for security purposes
- Organization account creators automatically receive admin rights
- Admin privileges should be granted carefully and only to trusted users

## Support
For additional support or questions about admin functions, contact the system administrator or refer to the troubleshooting documentation.