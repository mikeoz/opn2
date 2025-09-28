# Template Granularity Standards

## Overview

This document outlines the standardized approach for creating card templates that support granular data sharing in the opn2 platform. The system allows for three distinct states:

1. **Simple Template Creation** - Users input data in natural, composite fields
2. **Simple Display** - Information displays as expected in a readable format  
3. **Granular Sharing** - Components are broken down for selective sharing

## Core Concepts

### Field Composition
Each template field can be defined with a composition rule that specifies:
- **Input Format**: How users enter the data (composite string vs individual fields)
- **Display Format**: How the data appears in the card view
- **Granular Components**: Individual pieces that can be shared selectively
- **Default Sharing**: Which components are shared by default

### Standard Field Types

#### 1. Full Name
- **Input**: "Harriet Helena Humble" (single field)
- **Display**: "Harriet Helena Humble"
- **Granular Components**:
  - [ ] First Name: "Harriet"
  - [ ] Middle Name: "Helena"  
  - [ ] Last Name: "Humble"

#### 2. Address
- **Input**: "1234 Main Street, Anytown, NY 21345" (single field)
- **Display**: "1234 Main Street, Anytown, NY 21345"
- **Granular Components**:
  - [ ] Street Number: "1234"
  - [ ] Street Name: "Main Street"
  - [x] City: "Anytown"
  - [x] State: "NY"
  - [ ] ZIP Code: "21345"

#### 3. Phone Number
- **Input**: "(555) 123-4567" (single field)
- **Display**: "(555) 123-4567"
- **Granular Components**:
  - [ ] Area Code: "555"
  - [ ] Exchange: "123"
  - [ ] Number: "4567"

#### 4. Email Address
- **Input**: "harriet@example.com" (single field)
- **Display**: "harriet@example.com"
- **Granular Components**:
  - [x] Username: "harriet"
  - [ ] Domain: "example.com"

## Implementation Architecture

### Template Definition
Templates now support granularity configuration through the `TemplateGranularityConfig` interface:

```typescript
interface TemplateGranularityConfig {
  templateId: string;
  templateName: string;
  fieldCompositions: FieldComposition[];
}
```

### Field Composition Structure
```typescript
interface FieldComposition {
  fieldName: string;
  fieldType: string;
  displayFormat: string; // e.g., "{streetNumber} {streetName}, {city}, {state} {zip}"
  inputFormat: 'composite' | 'individual';
  components: GranularComponent[];
  separators?: {
    input?: string;
    display?: string;
  };
}
```

### Granular Component Definition
```typescript
interface GranularComponent {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
  defaultShared?: boolean; // Controls checkbox state in sharing dialog
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}
```

## User Experience Flow

### 1. Template Creation (Admin/User)
- Define field compositions using standard types or custom configurations
- Specify which components should be shared by default
- Set validation rules for each component

### 2. Card Creation (User)
- Users input data in natural, simple formats
- System stores both composite and parsed granular data
- Validation occurs at both composite and component levels

### 3. Card Display (User/Viewer)
- Information displays in readable, formatted strings
- No change to current display behavior

### 4. Card Sharing (User)
- Sharing dialog automatically parses composite fields
- Presents granular components with checkboxes
- Pre-selects components marked as `defaultShared: true`
- Eliminates need for "basic" vs "detailed" sharing modes

## Benefits

1. **Simplified Data Entry**: Users continue to enter data naturally
2. **Flexible Sharing**: Granular control without complexity
3. **Standardized Parsing**: Consistent behavior across field types
4. **Future-Proof**: Easy to add new field types and compositions
5. **Privacy-First**: Default sharing settings protect sensitive information

## Implementation Status

✅ **Completed**:
- Enhanced address parsing with proper component separation
- Granular sharing dialog with improved field parsing
- Standard field composition definitions

🚧 **Next Steps**:
- Integrate template granularity configuration into template creation
- Add UI for defining custom field compositions
- Implement component-level validation
- Add support for custom field types

## Best Practices

1. **Default Sharing**: Mark location-general components (city, state) as default shared, keep specific details (street address, ZIP) as opt-in
2. **Validation**: Use appropriate patterns for each component type
3. **Field Naming**: Use descriptive labels that users understand
4. **Error Handling**: Gracefully handle parsing failures with fallback behavior
5. **Privacy**: Err on the side of not sharing personal details by default