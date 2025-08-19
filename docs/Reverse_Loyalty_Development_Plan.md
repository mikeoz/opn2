# Reverse Loyalty System - Development Action Plan

## Overview
Transform the current system into a "reverse loyalty" platform where local merchants act as Trust Anchors, focusing on customer preferences and personalized service rather than traditional merchant-centric loyalty programs.

## Demo Population & Test Email Strategy

### Test Email Surrogate Solutions
1. **Email Plus Addressing**: Use `merchant+test001@example.com` format
2. **Subdomain Testing**: Create `test.merchant.local` email domains
3. **Demo Email Generator**: Built-in system to generate `demo_user_001@opn2.demo` addresses
4. **Sandbox Mode**: Toggle between production and demo environments

### Fictitious Population Data Structure
```
Demo Merchant: "Main Street Coffee & Books"
- 50 regular customers
- 25 occasional visitors  
- 15 new prospects
- Various demographics and preference profiles
```

## Development Stages & Checklist

### Stage 1: Modify Demo Screens for Real Activity Data ⏹️

#### Tasks:
- [ ] Update Recent Activity component to handle real data structure
- [ ] Modify People screen to display actual customer interactions
- [ ] Enhance Places screen with merchant location data
- [ ] Update Passions screen with customer preference tracking
- [ ] Implement Purposes screen for goal-based interactions
- [ ] Add "No Activity" placeholder states for empty data
- [ ] Create activity data models and types

#### Acceptance Criteria:
- All demo screens render with real data structure
- Graceful handling of empty/null activity states
- Clean fallbacks for missing data

### Stage 2: Enhanced Merchant Organization Accounts ⏹️

#### Tasks:
- [ ] Modify registration flow for organization accounts
- [ ] Add logo/image upload capability (max 2MB, 300x300px recommended)
- [ ] Integrate uploaded logos into CARD templates
- [ ] Update organization profile management
- [ ] Create merchant onboarding wizard
- [ ] Add organization branding settings

#### Technical Requirements:
- Image upload: JPG, PNG, SVG support
- Automatic resizing/optimization
- Storage in Supabase storage bucket
- Integration with existing organization management

### Stage 3: Enhanced Bulk Import System ⏹️

#### Tasks:
- [ ] Verify CARD templates scope to organization
- [ ] Add template preview "eyeball" icon functionality
- [ ] Implement custom filename for template downloads
- [ ] Add date stamping to download filenames
- [ ] Create template preview modal
- [ ] Enhance template selection UI

#### Features to Implement:
- Template preview: Shows all fields, types, and requirements
- Custom naming: "NewCustomerTemplate_17AUG25" format
- Better template organization and filtering

### Stage 4: Demo CSV Population Generator ⏹️

#### Tasks:
- [ ] Create demo data generator utility
- [ ] Generate realistic customer profiles
- [ ] Include varied data completeness (email/no email scenarios)
- [ ] Create sample merchant inventory items
- [ ] Generate interaction history data
- [ ] Export demo CSV files for testing

#### Demo Data Categories:
- Complete profiles (with email)
- Partial profiles (missing email)
- New prospects (minimal data)
- Existing members
- Various demographic segments

### Stage 5: Customer Invitation System ⏹️

#### Tasks:
- [ ] Design invitation workflow UI
- [ ] Implement email invitation system
- [ ] Create QR code generation for merchants
- [ ] Build customer scanning/linking flow
- [ ] Handle four invitation scenarios:
  1. Email available → Direct email invitation
  2. No email → Capture email flow
  3. Existing opn2 member → QR scan to link
  4. New user → Magic link registration

#### Technical Components:
- Email template system
- QR code generator with merchant branding
- Magic link authentication flow
- Customer-merchant relationship establishment

## Implementation Priority

### Phase 1 (Today): Foundation Setup
1. Stage 1: Demo screens modification
2. Stage 2: Organization account enhancement
3. Demo data strategy implementation

### Phase 2 (Next): Core Features
4. Stage 3: Bulk import enhancements
5. Stage 4: Demo population generator

### Phase 3 (Final): Customer Engagement
6. Stage 5: Invitation system
7. QR code scanning integration
8. Customer onboarding flows

## Key Technical Considerations

### Database Modifications Needed:
- Organization logo storage
- Activity tracking tables
- Customer-merchant relationships
- Invitation tracking
- QR code management

### New Components Required:
- Logo upload component
- Template preview modal
- Demo data generator
- Invitation workflow UI
- QR code display/scanner
- Activity feed components

### Integration Points:
- Supabase storage for images
- Email service for invitations
- QR code libraries
- Activity tracking system

## Success Metrics
- Merchant can complete full setup in <15 minutes
- Customer invitation success rate >80%
- Demo population covers all use cases
- System handles 100+ customers per merchant
- QR scanning works reliably across devices

## Next Steps
1. Review and approve this plan
2. Begin with Stage 1 implementation
3. Set up demo merchant account
4. Create initial test population
5. Iterative testing and refinement

---
*This plan provides a structured approach to implementing the reverse loyalty system while maintaining the existing functionality and ensuring smooth merchant and customer onboarding.*