/**
 * vCard Data Normalization Utilities
 * Standardizes and validates vCard data
 */

import { CardEnvelope } from './adapter';

/**
 * Normalize a CardEnvelope's data fields
 */
export function normalizeCardEnvelope(envelope: CardEnvelope): CardEnvelope {
  const normalized = { ...envelope };

  switch (envelope.card_type) {
    case 'personal_identity':
      normalized.data = normalizePersonalIdentity(envelope.data);
      break;
    case 'email':
      normalized.data = normalizeEmail(envelope.data);
      break;
    case 'phone':
      normalized.data = normalizePhone(envelope.data);
      break;
    case 'address':
      normalized.data = normalizeAddress(envelope.data);
      break;
  }

  return normalized;
}

/**
 * Normalize personal identity data
 */
function normalizePersonalIdentity(data: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};

  // Normalize names - trim whitespace
  if (data.givenName) normalized.givenName = data.givenName.trim();
  if (data.familyName) normalized.familyName = data.familyName.trim();
  if (data.displayName) normalized.displayName = data.displayName.trim();
  
  // Normalize middle names array
  if (data.middleNames) {
    normalized.middleNames = Array.isArray(data.middleNames)
      ? data.middleNames.map((n: string) => n.trim()).filter(Boolean)
      : [data.middleNames.trim()].filter(Boolean);
  }

  // Normalize nicknames array
  if (data.nicknames) {
    normalized.nicknames = Array.isArray(data.nicknames)
      ? data.nicknames.map((n: string) => n.trim()).filter(Boolean)
      : [data.nicknames.trim()].filter(Boolean);
  }

  // Copy other fields as-is
  if (data.honorificPrefix) normalized.honorificPrefix = data.honorificPrefix.trim();
  if (data.honorificSuffix) normalized.honorificSuffix = data.honorificSuffix.trim();
  if (data.dateOfBirth) normalized.dateOfBirth = data.dateOfBirth;
  if (data.profilePhoto) normalized.profilePhoto = data.profilePhoto;
  if (data.organization) normalized.organization = data.organization;
  if (data.jobTitle) normalized.jobTitle = data.jobTitle.trim();

  return normalized;
}

/**
 * Normalize email data
 */
function normalizeEmail(data: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};

  // Normalize email to lowercase
  if (data.username) normalized.username = data.username.toLowerCase().trim();
  if (data.domain) normalized.domain = data.domain.toLowerCase().trim();
  if (data.fullAddress) normalized.fullAddress = data.fullAddress.toLowerCase().trim();

  // Normalize labels
  if (data.labels) {
    normalized.labels = normalizeLabels(data.labels);
  }

  if (data.isPrimary !== undefined) {
    normalized.isPrimary = Boolean(data.isPrimary);
  }

  return normalized;
}

/**
 * Normalize phone data
 */
function normalizePhone(data: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};

  // Remove non-numeric characters for component fields
  if (data.countryCode) normalized.countryCode = data.countryCode.replace(/\D/g, '');
  if (data.areaCode) normalized.areaCode = data.areaCode.replace(/\D/g, '');
  if (data.exchange) normalized.exchange = data.exchange.replace(/\D/g, '');
  if (data.lineNumber) normalized.lineNumber = data.lineNumber.replace(/\D/g, '');

  // Keep full number as-is (may contain formatting)
  if (data.fullNumber) normalized.fullNumber = data.fullNumber.trim();

  // Normalize labels
  if (data.labels) {
    normalized.labels = normalizeLabels(data.labels);
  }

  if (data.isPrimary !== undefined) {
    normalized.isPrimary = Boolean(data.isPrimary);
  }

  return normalized;
}

/**
 * Normalize address data
 */
function normalizeAddress(data: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};

  // Trim all string fields
  const stringFields = [
    'poBox',
    'extendedAddress',
    'streetAddress',
    'locality',
    'region',
    'postalCode',
    'country'
  ];

  for (const field of stringFields) {
    if (data[field]) {
      normalized[field] = data[field].trim();
    }
  }

  // Normalize postal code format (remove spaces for US zip codes)
  if (normalized.postalCode) {
    // US ZIP code normalization
    const zipMatch = normalized.postalCode.match(/^(\d{5})[\s-]?(\d{4})?$/);
    if (zipMatch) {
      normalized.postalCode = zipMatch[2] 
        ? `${zipMatch[1]}-${zipMatch[2]}`
        : zipMatch[1];
    }
  }

  // Normalize country to ISO code (placeholder - would need full mapping)
  if (normalized.country) {
    normalized.country = normalizeCountry(normalized.country);
  }

  // Normalize labels
  if (data.labels) {
    normalized.labels = normalizeLabels(data.labels);
  }

  if (data.isPrimary !== undefined) {
    normalized.isPrimary = Boolean(data.isPrimary);
  }

  return normalized;
}

/**
 * Normalize labels array
 */
function normalizeLabels(labels: string | string[]): string[] {
  const labelArray = Array.isArray(labels) ? labels : [labels];
  
  return labelArray
    .map(l => l.toLowerCase().trim())
    .filter(Boolean)
    .map(l => {
      // Map common variations to standard labels
      const labelMap: Record<string, string> = {
        'internet': 'work',
        'pref': 'primary',
        'cell': 'mobile',
        'voice': 'phone',
        'fax': 'fax',
        'msg': 'messaging'
      };
      return labelMap[l] || l;
    });
}

/**
 * Normalize country name to ISO code (basic implementation)
 */
function normalizeCountry(country: string): string {
  const countryMap: Record<string, string> = {
    'united states': 'US',
    'usa': 'US',
    'us': 'US',
    'united kingdom': 'GB',
    'uk': 'GB',
    'canada': 'CA',
    'mexico': 'MX',
    // Add more as needed
  };

  const lower = country.toLowerCase().trim();
  return countryMap[lower] || country;
}

/**
 * Validate card envelope data
 */
export function validateCardEnvelope(envelope: CardEnvelope): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!envelope.card_id) errors.push('Missing card_id');
  if (!envelope.person_id) errors.push('Missing person_id');
  if (!envelope.card_type) errors.push('Missing card_type');
  if (!envelope.data) errors.push('Missing data');
  if (!envelope.version) errors.push('Missing version');

  // Validate provenance
  if (!envelope.provenance) {
    errors.push('Missing provenance');
  } else {
    if (!envelope.provenance.source) errors.push('Missing provenance.source');
    if (typeof envelope.provenance.confidence !== 'number') {
      errors.push('Invalid provenance.confidence');
    }
    if (!envelope.provenance.precedence) errors.push('Missing provenance.precedence');
  }

  // Type-specific validation
  switch (envelope.card_type) {
    case 'email':
      validateEmailData(envelope.data, errors);
      break;
    case 'phone':
      validatePhoneData(envelope.data, errors);
      break;
    case 'address':
      validateAddressData(envelope.data, errors);
      break;
    case 'personal_identity':
      validatePersonalIdentityData(envelope.data, errors);
      break;
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate email data
 */
function validateEmailData(data: Record<string, any>, errors: string[]): void {
  if (!data.fullAddress) {
    errors.push('Email card missing fullAddress');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.fullAddress)) {
      errors.push('Invalid email format');
    }
  }

  if (!data.username) errors.push('Email card missing username');
  if (!data.domain) errors.push('Email card missing domain');
}

/**
 * Validate phone data
 */
function validatePhoneData(data: Record<string, any>, errors: string[]): void {
  if (!data.fullNumber) {
    errors.push('Phone card missing fullNumber');
  }

  // If we have components, validate them
  if (data.countryCode && !/^\d+$/.test(data.countryCode)) {
    errors.push('Invalid countryCode format');
  }
  if (data.areaCode && !/^\d+$/.test(data.areaCode)) {
    errors.push('Invalid areaCode format');
  }
  if (data.exchange && !/^\d+$/.test(data.exchange)) {
    errors.push('Invalid exchange format');
  }
  if (data.lineNumber && !/^\d+$/.test(data.lineNumber)) {
    errors.push('Invalid lineNumber format');
  }
}

/**
 * Validate address data
 */
function validateAddressData(data: Record<string, any>, errors: string[]): void {
  // At least one address component should be present
  const hasComponent = ['streetAddress', 'locality', 'region', 'postalCode', 'country']
    .some(field => data[field]);

  if (!hasComponent) {
    errors.push('Address card missing all address components');
  }
}

/**
 * Validate personal identity data
 */
function validatePersonalIdentityData(data: Record<string, any>, errors: string[]): void {
  // At least one name field should be present
  const hasName = data.givenName || data.familyName || data.displayName;

  if (!hasName) {
    errors.push('Personal identity card missing all name fields');
  }
}

/**
 * Calculate data completeness score (0-100)
 */
export function calculateCompletenessScore(envelope: CardEnvelope): number {
  const data = envelope.data;
  
  switch (envelope.card_type) {
    case 'personal_identity':
      return calculatePersonalIdentityCompleteness(data);
    case 'email':
      return calculateEmailCompleteness(data);
    case 'phone':
      return calculatePhoneCompleteness(data);
    case 'address':
      return calculateAddressCompleteness(data);
    default:
      return 0;
  }
}

function calculatePersonalIdentityCompleteness(data: Record<string, any>): number {
  const fields = [
    'givenName', 'familyName', 'displayName', 'dateOfBirth',
    'profilePhoto', 'organization', 'jobTitle'
  ];
  
  const present = fields.filter(f => data[f]).length;
  return Math.round((present / fields.length) * 100);
}

function calculateEmailCompleteness(data: Record<string, any>): number {
  const required = ['username', 'domain', 'fullAddress'];
  const optional = ['labels'];
  
  const presentRequired = required.filter(f => data[f]).length;
  const presentOptional = optional.filter(f => data[f]).length;
  
  return Math.round(((presentRequired / required.length) * 80) + ((presentOptional / optional.length) * 20));
}

function calculatePhoneCompleteness(data: Record<string, any>): number {
  const required = ['fullNumber'];
  const optional = ['countryCode', 'areaCode', 'exchange', 'lineNumber', 'labels'];
  
  const presentRequired = required.filter(f => data[f]).length;
  const presentOptional = optional.filter(f => data[f]).length;
  
  return Math.round(((presentRequired / required.length) * 70) + ((presentOptional / optional.length) * 30));
}

function calculateAddressCompleteness(data: Record<string, any>): number {
  const fields = [
    'streetAddress', 'locality', 'region', 'postalCode', 'country'
  ];
  
  const present = fields.filter(f => data[f]).length;
  return Math.round((present / fields.length) * 100);
}
