# Card Template Granularity Mapping

## Overview

This document maps existing card templates in the opn2 platform to the new Template Granularity Standards framework. Each template is analyzed for its field composition requirements and alignment with standardized granular sharing capabilities.

---

## Family Card Templates

### 1. Family Member Card
**Template Context**: `general_family`  
**Current Fields**:
- Display Name (text, required)
- Birth Name (text, optional) 
- Family Relationships (text, optional)
- Current Location (text, optional)
- Occupation (text, optional)

**Granularity Standards Mapping**:
```typescript
{
  templateId: "family_member_card",
  templateName: "Family Member Card",
  fieldCompositions: [
    {
      fieldName: "Display Name",
      fieldType: "fullName",
      displayFormat: "{firstName} {middleName} {lastName}",
      inputFormat: "composite",
      components: STANDARD_FIELD_COMPOSITIONS.fullName.components
    },
    {
      fieldName: "Birth Name", 
      fieldType: "fullName",
      displayFormat: "{firstName} {middleName} {lastName}",
      inputFormat: "composite",
      components: STANDARD_FIELD_COMPOSITIONS.fullName.components
    },
    {
      fieldName: "Current Location",
      fieldType: "fullAddress", 
      displayFormat: "{streetNumber} {streetName}, {city}, {state} {postalCode}",
      inputFormat: "composite",
      components: STANDARD_FIELD_COMPOSITIONS.fullAddress.components
    }
  ]
}
```

### 2. Parent Information Card
**Template Context**: `parent_to_child`  
**Current Fields**:
- Full Name (text, required)
- Birth Name (text, optional)
- Role in Family (text, required)
- Generation (number, required)
- Contact Information (text, optional)
- Important Dates (text, optional)

**Granularity Standards Mapping**:
```typescript
{
  templateId: "parent_information_card",
  templateName: "Parent Information Card", 
  fieldCompositions: [
    {
      fieldName: "Full Name",
      fieldType: "fullName",
      displayFormat: "{firstName} {middleName} {lastName}",
      inputFormat: "composite",
      components: STANDARD_FIELD_COMPOSITIONS.fullName.components
    },
    {
      fieldName: "Birth Name",
      fieldType: "fullName", 
      displayFormat: "{firstName} {middleName} {lastName}",
      inputFormat: "composite",
      components: STANDARD_FIELD_COMPOSITIONS.fullName.components
    },
    {
      fieldName: "Contact Information",
      fieldType: "contactInfo",
      displayFormat: "{phoneNumber} | {emailAddress}",
      inputFormat: "composite",
      components: [
        { id: "phoneNumber", label: "Phone Number", defaultShared: false },
        { id: "emailAddress", label: "Email Address", defaultShared: true }
      ]
    }
  ]
}
```

### 3. Spouse Information Card
**Template Context**: `spouse`  
**Current Fields**:
- Full Name (text, required)
- Maiden Name (text, optional)
- Marriage Date (date, optional)
- Spouse Role (text, required)
- Contact Information (text, optional)

**Granularity Standards Mapping**:
```typescript
{
  templateId: "spouse_information_card", 
  templateName: "Spouse Information Card",
  fieldCompositions: [
    {
      fieldName: "Full Name",
      fieldType: "fullName",
      displayFormat: "{firstName} {middleName} {lastName}",
      inputFormat: "composite", 
      components: STANDARD_FIELD_COMPOSITIONS.fullName.components
    },
    {
      fieldName: "Maiden Name",
      fieldType: "fullName",
      displayFormat: "{firstName} {middleName} {lastName}",
      inputFormat: "composite",
      components: STANDARD_FIELD_COMPOSITIONS.fullName.components
    },
    {
      fieldName: "Contact Information",
      fieldType: "contactInfo",
      displayFormat: "{phoneNumber} | {emailAddress}",
      inputFormat: "composite",
      components: [
        { id: "phoneNumber", label: "Phone Number", defaultShared: false },
        { id: "emailAddress", label: "Email Address", defaultShared: true }
      ]
    }
  ]
}
```

---

## Standard Card Templates

### 1. Personal Identity Card
**Category**: `identity`  
**Current Fields**:
- Full Name (string, required)
- Date of Birth (string, required)
- Address (string, optional)
- Phone Number (string, optional)
- Email (string, optional)
- Photo (image, optional)

**Granularity Standards Mapping**:
```typescript
{
  templateId: "personal_identity_card",
  templateName: "Personal Identity Card",
  fieldCompositions: [
    {
      fieldName: "Full Name",
      fieldType: "fullName",
      displayFormat: "{firstName} {middleName} {lastName}",
      inputFormat: "composite",
      components: STANDARD_FIELD_COMPOSITIONS.fullName.components
    },
    {
      fieldName: "Address", 
      fieldType: "fullAddress",
      displayFormat: "{streetNumber} {streetName}, {city}, {state} {postalCode}",
      inputFormat: "composite",
      components: STANDARD_FIELD_COMPOSITIONS.fullAddress.components
    },
    {
      fieldName: "Phone Number",
      fieldType: "phoneNumber",
      displayFormat: "({areaCode}) {exchange}-{number}",
      inputFormat: "composite",
      components: STANDARD_FIELD_COMPOSITIONS.phoneNumber.components
    },
    {
      fieldName: "Email",
      fieldType: "emailAddress", 
      displayFormat: "{username}@{domain}",
      inputFormat: "composite",
      components: STANDARD_FIELD_COMPOSITIONS.emailAddress.components
    }
  ]
}
```

### 2. Emergency Contact Card
**Category**: `emergency`  
**Current Fields**:
- Full Name (string, required)
- Relationship (string, required)
- Primary Phone (string, required)
- Secondary Phone (string, optional)
- Email (string, optional)
- Address (string, optional)

**Granularity Standards Mapping**:
```typescript
{
  templateId: "emergency_contact_card",
  templateName: "Emergency Contact Card",
  fieldCompositions: [
    {
      fieldName: "Full Name",
      fieldType: "fullName",
      displayFormat: "{firstName} {middleName} {lastName}",
      inputFormat: "composite",
      components: STANDARD_FIELD_COMPOSITIONS.fullName.components
    },
    {
      fieldName: "Primary Phone",
      fieldType: "phoneNumber",
      displayFormat: "({areaCode}) {exchange}-{number}",
      inputFormat: "composite", 
      components: STANDARD_FIELD_COMPOSITIONS.phoneNumber.components
    },
    {
      fieldName: "Secondary Phone",
      fieldType: "phoneNumber",
      displayFormat: "({areaCode}) {exchange}-{number}",
      inputFormat: "composite",
      components: STANDARD_FIELD_COMPOSITIONS.phoneNumber.components
    },
    {
      fieldName: "Email",
      fieldType: "emailAddress",
      displayFormat: "{username}@{domain}",
      inputFormat: "composite",
      components: STANDARD_FIELD_COMPOSITIONS.emailAddress.components
    },
    {
      fieldName: "Address",
      fieldType: "fullAddress",
      displayFormat: "{streetNumber} {streetName}, {city}, {state} {postalCode}",
      inputFormat: "composite",
      components: STANDARD_FIELD_COMPOSITIONS.fullAddress.components
    }
  ]
}
```

### 3. Address Card
**Category**: `Contact Information`  
**Current Fields**:
- address_type (string, required, default: "Home")
- custom_label (string, optional)
- street_address (string, required)
- city (string, required)
- state_province (string, required)
- postal_code (string, required)
- country (string, required, default: "United States")

**Granularity Standards Mapping**:
```typescript
{
  templateId: "address_card",
  templateName: "addressCARD",
  fieldCompositions: [
    {
      fieldName: "street_address",
      fieldType: "streetAddress",
      displayFormat: "{streetNumber} {streetName}",
      inputFormat: "composite",
      components: [
        { id: "streetNumber", label: "Street Number", defaultShared: false },
        { id: "streetName", label: "Street Name", defaultShared: false }
      ]
    },
    {
      fieldName: "Full Address",
      fieldType: "fullAddress",
      displayFormat: "{streetNumber} {streetName}, {city}, {state} {postalCode}",
      inputFormat: "composite",
      components: STANDARD_FIELD_COMPOSITIONS.fullAddress.components
    }
  ]
}
```

### 4. Phone Card  
**Category**: `Contact Information`  
**Current Fields**:
- phone_type (string, required, default: "Mobile")
- custom_label (string, optional)
- phone_number (string, required)
- extension (string, optional)

**Granularity Standards Mapping**:
```typescript
{
  templateId: "phone_card",
  templateName: "phoneCARD",
  fieldCompositions: [
    {
      fieldName: "phone_number",
      fieldType: "phoneNumber",
      displayFormat: "({areaCode}) {exchange}-{number}",
      inputFormat: "composite",
      components: STANDARD_FIELD_COMPOSITIONS.phoneNumber.components
    }
  ]
}
```

### 5. Email Card
**Category**: `Contact Information`  
**Current Fields**:
- email_type (string, required, default: "Home")
- custom_label (string, optional)
- email_address (string, required)

**Granularity Standards Mapping**:
```typescript
{
  templateId: "email_card",
  templateName: "emailCARD", 
  fieldCompositions: [
    {
      fieldName: "email_address",
      fieldType: "emailAddress",
      displayFormat: "{username}@{domain}",
      inputFormat: "composite",
      components: STANDARD_FIELD_COMPOSITIONS.emailAddress.components
    }
  ]
}
```

### 6. Medical Card
**Category**: `Medical & Family`  
**Current Fields**:
- medical_notes (string, optional)
- allergies (string, optional)
- medications (string, optional)
- emergency_contact (string, optional)
- emergency_phone (string, optional)

**Granularity Standards Mapping**:
```typescript
{
  templateId: "medical_card",
  templateName: "medicalCARD",
  fieldCompositions: [
    {
      fieldName: "emergency_contact",
      fieldType: "fullName", 
      displayFormat: "{firstName} {middleName} {lastName}",
      inputFormat: "composite",
      components: STANDARD_FIELD_COMPOSITIONS.fullName.components
    },
    {
      fieldName: "emergency_phone",
      fieldType: "phoneNumber",
      displayFormat: "({areaCode}) {exchange}-{number}",
      inputFormat: "composite",
      components: STANDARD_FIELD_COMPOSITIONS.phoneNumber.components
    }
  ]
}
```

### 7. School Card
**Category**: `Educational`  
**Current Fields**:
- school_name (string, required)
- school_type (string, required)
- address_reference (string, optional)

**Granularity Standards Mapping**:
```typescript
{
  templateId: "school_card",
  templateName: "schoolCARD",
  fieldCompositions: [
    {
      fieldName: "address_reference",
      fieldType: "fullAddress",
      displayFormat: "{streetNumber} {streetName}, {city}, {state} {postalCode}",
      inputFormat: "composite",
      components: STANDARD_FIELD_COMPOSITIONS.fullAddress.components
    }
  ]
}
```

### 8. Organization Member Card
**Category**: `Organization & Role`  
**Current Fields**:
- membership_type (string, required)
- issue_date (string, required)
- expiry_date (string, optional)
- issuing_organization (string, required)
- inactive_reason (string, optional)
- inactive_date (string, optional)

**Granularity Standards Mapping**:
```typescript
{
  templateId: "org_member_card",
  templateName: "orgMemberCARD",
  fieldCompositions: [
    // No composite fields requiring granular parsing
    // All fields are atomic strings or dates
  ]
}
```

---

## Implementation Priority

### High Priority (Immediate Implementation Required)
1. **Personal Identity Card** - Most commonly used, contains all standard field types
2. **Emergency Contact Card** - Critical functionality, multiple composite fields
3. **Family Member Card** - Core family functionality

### Medium Priority
4. **Address Card** - Foundational contact information
5. **Phone Card** - Essential contact component
6. **Email Card** - Essential contact component

### Lower Priority  
7. **Parent/Spouse Information Cards** - Similar patterns to Family Member Card
8. **Medical/School/Organization Cards** - Fewer composite fields

---

## Migration Strategy

1. **Phase 1**: Implement granularity configurations for high-priority templates
2. **Phase 2**: Update existing card creation/editing flows to use granular parsing
3. **Phase 3**: Migrate medium-priority templates
4. **Phase 4**: Complete remaining templates and add custom field composition UI

Each template should be updated to include the `TemplateGranularityConfig` in its metadata, allowing the sharing dialog to automatically parse composite fields into granular components for selective sharing.