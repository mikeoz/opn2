/**
 * Template Granularity Standards
 * 
 * This module defines the standard approach for creating card templates that support
 * granular data sharing. Templates can define field composition rules that specify:
 * 1. How simple input fields are composed from granular components
 * 2. How granular components are extracted for selective sharing
 * 3. Default sharing preferences for each component
 */

export interface GranularComponent {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
  defaultShared?: boolean;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface FieldComposition {
  fieldName: string;
  fieldType: string;
  displayFormat: string; // Template string for display, e.g., "{streetNumber} {streetName}"
  inputFormat: 'composite' | 'individual'; // How data is collected
  components: GranularComponent[];
  separators?: {
    input?: string; // How to split input into components
    display?: string; // How to join components for display
  };
}

export interface TemplateGranularityConfig {
  templateId: string;
  templateName: string;
  fieldCompositions: FieldComposition[];
}

// Standard field compositions for common data types
export const STANDARD_FIELD_COMPOSITIONS: Record<string, FieldComposition> = {
  fullName: {
    fieldName: 'Full Name',
    fieldType: 'name',
    displayFormat: '{firstName} {middleName} {lastName}',
    inputFormat: 'composite',
    separators: {
      input: ' ',
      display: ' '
    },
    components: [
      {
        id: 'firstName',
        label: 'First Name',
        required: true,
        defaultShared: true,
        validation: { minLength: 1, maxLength: 50 }
      },
      {
        id: 'middleName',
        label: 'Middle Name',
        required: false,
        defaultShared: false,
        validation: { maxLength: 50 }
      },
      {
        id: 'lastName',
        label: 'Last Name',
        required: true,
        defaultShared: true,
        validation: { minLength: 1, maxLength: 50 }
      }
    ]
  },

  fullAddress: {
    fieldName: 'Address',
    fieldType: 'address',
    displayFormat: '{streetNumber} {streetName}, {city}, {state} {zip}',
    inputFormat: 'composite',
    separators: {
      input: ', ',
      display: ', '
    },
    components: [
      {
        id: 'streetNumber',
        label: 'Street Number',
        required: true,
        defaultShared: false,
        validation: { pattern: '^\\d+$' }
      },
      {
        id: 'streetName',
        label: 'Street Name',
        required: true,
        defaultShared: false,
        validation: { minLength: 1, maxLength: 100 }
      },
      {
        id: 'city',
        label: 'City',
        required: true,
        defaultShared: true,
        validation: { minLength: 1, maxLength: 50 }
      },
      {
        id: 'state',
        label: 'State',
        required: true,
        defaultShared: true,
        validation: { pattern: '^[A-Z]{2}$' }
      },
      {
        id: 'zip',
        label: 'ZIP Code',
        required: true,
        defaultShared: false,
        validation: { pattern: '^\\d{5}(-\\d{4})?$' }
      }
    ]
  },

  phoneNumber: {
    fieldName: 'Phone Number',
    fieldType: 'phone',
    displayFormat: '({areaCode}) {exchange}-{number}',
    inputFormat: 'composite',
    separators: {
      input: '-',
      display: ' '
    },
    components: [
      {
        id: 'areaCode',
        label: 'Area Code',
        required: true,
        defaultShared: false,
        validation: { pattern: '^\\d{3}$' }
      },
      {
        id: 'exchange',
        label: 'Exchange',
        required: true,
        defaultShared: false,
        validation: { pattern: '^\\d{3}$' }
      },
      {
        id: 'number',
        label: 'Number',
        required: true,
        defaultShared: false,
        validation: { pattern: '^\\d{4}$' }
      }
    ]
  },

  emailAddress: {
    fieldName: 'Email',
    fieldType: 'email',
    displayFormat: '{username}@{domain}',
    inputFormat: 'composite',
    separators: {
      input: '@',
      display: '@'
    },
    components: [
      {
        id: 'username',
        label: 'Username',
        required: true,
        defaultShared: true,
        validation: { minLength: 1, maxLength: 64 }
      },
      {
        id: 'domain',
        label: 'Domain',
        required: true,
        defaultShared: false,
        validation: { minLength: 1, maxLength: 253 }
      }
    ]
  }
};

/**
 * Parse composite field value into granular components
 */
export function parseCompositeField(
  value: string,
  composition: FieldComposition
): Record<string, string> {
  const result: Record<string, string> = {};
  
  if (!value) return result;

  switch (composition.fieldType) {
    case 'name':
      return parseNameField(value, composition);
    case 'address':
      return parseAddressField(value, composition);
    case 'phone':
      return parsePhoneField(value, composition);
    case 'email':
      return parseEmailField(value, composition);
    default:
      return parseGenericField(value, composition);
  }
}

function parseNameField(value: string, composition: FieldComposition): Record<string, string> {
  const parts = value.trim().split(/\s+/);
  const result: Record<string, string> = {};
  
  if (parts.length === 1) {
    result.firstName = parts[0];
  } else if (parts.length === 2) {
    result.firstName = parts[0];
    result.lastName = parts[1];
  } else if (parts.length >= 3) {
    result.firstName = parts[0];
    result.middleName = parts.slice(1, -1).join(' ');
    result.lastName = parts[parts.length - 1];
  }
  
  return result;
}

function parseAddressField(value: string, composition: FieldComposition): Record<string, string> {
  const result: Record<string, string> = {};
  
  // Enhanced address parsing patterns
  const fullPattern = /^(\d+)\s+([^,]+),\s*([^,]+),?\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/;
  const altPattern = /^(\d+)\s+([^,]+),\s*([^,]+)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/;
  
  const match = value.match(fullPattern) || value.match(altPattern);
  
  if (match) {
    const [, streetNumber, streetName, city, state, zip] = match;
    result.streetNumber = streetNumber;
    result.streetName = streetName.trim();
    result.city = city.trim();
    result.state = state.trim();
    result.zip = zip.trim();
  }
  
  return result;
}

function parsePhoneField(value: string, composition: FieldComposition): Record<string, string> {
  const result: Record<string, string> = {};
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    result.areaCode = cleaned.slice(0, 3);
    result.exchange = cleaned.slice(3, 6);
    result.number = cleaned.slice(6, 10);
  }
  
  return result;
}

function parseEmailField(value: string, composition: FieldComposition): Record<string, string> {
  const result: Record<string, string> = {};
  const parts = value.split('@');
  
  if (parts.length === 2) {
    result.username = parts[0];
    result.domain = parts[1];
  }
  
  return result;
}

function parseGenericField(value: string, composition: FieldComposition): Record<string, string> {
  const result: Record<string, string> = {};
  const separator = composition.separators?.input || ' ';
  const parts = value.split(separator);
  
  composition.components.forEach((component, index) => {
    if (parts[index]) {
      result[component.id] = parts[index].trim();
    }
  });
  
  return result;
}

/**
 * Compose granular components back into a display string
 */
export function composeDisplayValue(
  components: Record<string, string>,
  composition: FieldComposition
): string {
  let display = composition.displayFormat;
  
  composition.components.forEach(component => {
    const value = components[component.id] || '';
    display = display.replace(`{${component.id}}`, value);
  });
  
  // Clean up extra spaces and punctuation
  return display.replace(/\s+/g, ' ').replace(/,\s*,/g, ',').trim();
}

/**
 * Get default sharing configuration for a field composition
 */
export function getDefaultSharingConfig(composition: FieldComposition): Record<string, boolean> {
  const config: Record<string, boolean> = {};
  
  composition.components.forEach(component => {
    config[component.id] = component.defaultShared ?? false;
  });
  
  return config;
}