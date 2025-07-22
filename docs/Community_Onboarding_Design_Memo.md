# Community Onboarding System Design Memo
## Strategic Implementation Plan for opn2 Organization Member Invitations

### Executive Summary

This memo outlines the strategic design for implementing a Community Onboarding system within the opn2 application, enabling Non-Individual (Organization) users to invite and onboard their members through a structured card-based approach.

### Core System Architecture Changes

#### 1. Card Template Hierarchy
The system will support two primary categories of card templates:

**Standard Template Cards (STCs)**
- Created and managed by opn2 Administrators
- Designed for broad cross-community usage
- Standardized field structures and validation rules
- Available to all organizations

**User Template Cards (UTCs)**
- Created by Individual users or Administrators for specific organizations
- Community-specific customizations and fields
- Inherit base structure from STCs but allow custom extensions
- Scoped to the creating organization

#### 2. BBT Use Case Analysis

Based on the uploaded field mappings, the BBT community requires:
- **735 registered members** across 6 categories
- **Household-based organization** with family linkages
- **Property-specific addressing** for leaseholders
- **Multi-generational membership** tracking
- **Role-based access** (Leaseholder, Family, Friend, Child, Renter, Unassigned)

### Required Standard Template Cards (STCs)

#### Personal Information STCs
1. **birthCARD**
   - Fields: birth_month, birth_day, birth_year, show_year (boolean)
   - Validation: Date validation, privacy controls

2. **anniversaryCARD**
   - Fields: anniversary_month, anniversary_day, anniversary_year, show_year (boolean)
   - Validation: Date validation, privacy controls

3. **sexCARD** (Gender)
   - Fields: gender (dropdown: M/F/Other/Prefer not to say)
   - Note: Column label should be updated from "gender" to "sex" for consistency

4. **maritalCARD**
   - Fields: marital_status (boolean), spouse_reference (optional link to another personCARD)
   - Associated with familyCARD for shared household information

#### Educational STCs
5. **gradeCARD**
   - Fields: grade_level, school_year, status (active/graduated)
   - Links to associated schoolCARD

6. **schoolCARD** (specialized placeCARD)
   - Fields: school_name, school_type, address_reference
   - Inherits from base placeCARD structure

#### Medical & Family STCs
7. **medicalCARD**
   - Fields: medical_notes, allergies, emergency_contact, medications
   - Privacy: High-security, limited sharing permissions

8. **kidCARD**
   - Fields: minor_status (boolean), parent_guardian_references (array)
   - Links: Always associated with parent/guardian personCARDs
   - Auto-expires: Based on age/graduation

#### Organization & Role STCs
9. **statusCARD**
   - Fields: active_member (boolean), status_type, effective_date
   - Organization-specific status tracking

10. **orgMemberCARD**
    - Fields: membership_type, issue_date, expiry_date, issuing_organization
    - Sub-fields: inactive_reason, inactive_date
    - Permissions: Issued by organization, shared with member

11. **roleCARD**
    - Fields: role_title (dropdown + custom), begin_date, end_date, notes
    - Dropdown options: Teacher, Staff, Employee, bgCheck, 1st Responder, Other
    - Flexible: "Other" allows custom role definition

#### Enhanced Contact STCs
12. **addressCARD** (Enhanced)
    - Added field: address_type (dropdown: Home, Work, User Label)
    - User Label: Allows custom labels like "BBT"
    - Maintains existing address structure

13. **phoneCARD** (Enhanced)
    - Added field: phone_type (dropdown: Home, Work, Mobile, Pager, Fax, Skype, User Label)
    - User Label: Allows custom labels

14. **emailCARD** (Enhanced)
    - Added field: email_type (dropdown: Home, Work, User Label)
    - User Label: Allows custom labels

### BBT-Specific User Template Cards (UTCs)

#### 1. BBT Address UTC
Extends addressCARD with BBT-specific fields:
```
- Standard addressCARD fields
- lot_number
- additional_lot_number  
- bethany_street_number
- bethany_street_name
- additional_leasehold_contact
- address_type: "BBT" (pre-filled)
```

#### 2. householdCARD UTC
```
- household_id (BBT system ID)
- household_name
- household_primary_contact (reference to personCARD)
- household_type (Leaseholder/Family/Friend/Renter)
```

#### 3. userAdminCARD UTC
```
- admin_action_type
- begin_date
- update_date
- modified_by (organization admin reference)
- change_notes
```

### Community Onboarding Workflow

#### Phase 1: Organization Setup
1. **Template Creation**
   - Organization admin creates required UTCs
   - Configure BBT-specific field mappings
   - Set up invitation email templates

2. **Data Preparation**
   - Upload member spreadsheet with standardized column labels
   - System validates data against template requirements
   - Preview generated card structures

#### Phase 2: Member Invitation Process

**For Non-Users (No opn2 Account)**
1. System generates unique invitation tokens
2. Email invitation with account creation link
3. New user registration with pre-populated card data
4. Cards automatically added to user's CARDbank upon account creation

**For Existing Users**
1. System identifies existing accounts by email
2. Email invitation with card acceptance link
3. User reviews and accepts/modifies proposed cards
4. Cards added to existing CARDbank

#### Phase 3: Data Handling Strategy

**Columns to Process:**
- All fields mapped to STCs and UTCs above
- Household information → householdCARD UTC
- Address information → BBT Address UTC + standard addressCARD

**Columns to Ignore:**
- Services User, Calendar User, Check-Ins User
- Registrations User, People User, Groups User, Publishing User
- System logs these as "not processed" for audit purposes

### Technical Implementation Requirements

#### Database Schema Changes
1. **Card Template Types**
   - Add `template_category` enum: 'standard', 'user'
   - Add `organization_id` for UTCs
   - Add `base_template_id` for UTC inheritance

2. **Invitation System**
   - `community_invitations` table
   - Token-based invitation tracking
   - Bulk invitation job processing

3. **Member Data Import**
   - `import_staging` table for data validation
   - Field mapping configuration storage
   - Error tracking and resolution

#### Email Integration
- Resend.com integration for invitation emails
- Template-based email generation
- Delivery tracking and retry logic

### Step-by-Step Work Plan

#### Week 1-2: Foundation
1. Create STC templates (birthCARD, anniversaryCARD, etc.)
2. Enhanced contact cards (address, phone, email) with type dropdowns
3. Database schema updates for template categories

#### Week 3-4: BBT Specifics
1. BBT Address UTC creation
2. householdCARD UTC implementation
3. userAdminCARD UTC development
4. Column mapping configuration interface

#### Week 5-6: Invitation System
1. Email invitation infrastructure
2. Token-based invitation processing
3. New user vs existing user workflow handling
4. CARDbank integration for card acceptance

#### Week 7-8: Data Import & Testing
1. Spreadsheet upload and validation
2. Field mapping interface
3. Bulk processing and error handling
4. End-to-end testing with BBT data

### Risk Mitigation

1. **Data Privacy**: Implement granular sharing permissions for medical and personal cards
2. **Scale**: Design for organizations larger than BBT's 735 members
3. **Flexibility**: UTC system allows for other organization types beyond residential communities
4. **User Experience**: Clear invitation emails and intuitive card acceptance process

### Success Metrics

1. **Adoption**: Percentage of invited members who create accounts/accept cards
2. **Data Quality**: Accuracy of imported card data
3. **User Satisfaction**: Organization admin feedback on process efficiency
4. **System Performance**: Bulk invitation processing times

### Next Steps

This memo serves as the foundation for implementation. Upon approval, we should:

1. Begin with STC creation and testing
2. Develop the BBT UTC prototypes
3. Create a test environment with sample BBT data
4. Iterate on the invitation workflow design

Would you like me to proceed with implementing any specific component of this design, or would you prefer to review and refine the strategic approach first?