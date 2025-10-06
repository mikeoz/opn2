/**
 * vCard to CardEnvelope Adapter
 * Converts parsed vCard data to the granular CardEnvelope format
 */

import { ParsedVCard, VCardProperty, getProperty, getProperties, getStructuredName } from './parser';
import yaml from 'js-yaml';

export interface CardEnvelope {
  card_id: string;
  person_id: string;
  owner_user_id?: string;
  card_type: string;
  data: Record<string, any>;
  provenance: {
    source: string;
    confidence: number;
    precedence: 'user_input' | 'imported' | 'inferred' | 'derived';
    importedAt?: string;
    sourceId?: string;
  };
  verification?: {
    verified: boolean;
    verifiedAt?: string;
    verifiedBy?: string;
  };
  consent?: {
    defaultConsent: boolean;
    recipients?: string[];
    granted_at?: string;
    revoked_at?: string;
  };
  fieldPolicies?: Array<{
    path: string;
    scope: 'public' | 'authenticated' | 'family' | 'friends' | 'private';
    recipients?: string[];
    consent?: boolean;
  }>;
  version: string;
}

export interface AdapterOptions {
  ownerId?: string;
  personId?: string;
  source?: string;
  confidence?: number;
  mappingYaml?: string;
}

/**
 * Convert parsed vCard to CardEnvelopes (one per card type)
 */
export async function vcardToCardEnvelopes(
  vcard: ParsedVCard,
  options: AdapterOptions = {}
): Promise<CardEnvelope[]> {
  const envelopes: CardEnvelope[] = [];
  const personId = options.personId || generatePersonId(vcard);
  const now = new Date().toISOString();

  // Load mapping from YAML
  const mapping = await loadMapping(options.mappingYaml);

  // Create personal_identity card
  const identityCard = createPersonalIdentityCard(vcard, personId, options, now);
  if (identityCard) envelopes.push(identityCard);

  // Create email cards
  const emailCards = createEmailCards(vcard, personId, options, now, mapping);
  envelopes.push(...emailCards);

  // Create phone cards
  const phoneCards = createPhoneCards(vcard, personId, options, now, mapping);
  envelopes.push(...phoneCards);

  // Create address cards
  const addressCards = createAddressCards(vcard, personId, options, now, mapping);
  envelopes.push(...addressCards);

  return envelopes;
}

/**
 * Generate a stable person_id from vCard data
 */
function generatePersonId(vcard: ParsedVCard): string {
  const fn = getProperty(vcard, 'FN')?.value;
  const uid = getProperty(vcard, 'UID')?.value;
  
  if (uid) return uid;
  if (fn) return `person-${hashString(fn)}`;
  
  return `person-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Load mapping YAML (placeholder for future implementation)
 */
async function loadMapping(yamlPath?: string): Promise<any> {
  // For now, use inline mapping
  return {};
}

/**
 * Create personal_identity card
 */
function createPersonalIdentityCard(
  vcard: ParsedVCard,
  personId: string,
  options: AdapterOptions,
  timestamp: string
): CardEnvelope | null {
  const n = getStructuredName(vcard);
  const fn = getProperty(vcard, 'FN')?.value;
  const nickname = getProperty(vcard, 'NICKNAME')?.value;
  const bday = getProperty(vcard, 'BDAY')?.value;
  const photo = getProperty(vcard, 'PHOTO');
  const org = getProperty(vcard, 'ORG')?.value?.split(';');
  const title = getProperty(vcard, 'TITLE')?.value;

  if (!n && !fn) return null;

  const data: Record<string, any> = {};

  // Name fields
  if (n) {
    if (n.givenName) data.givenName = n.givenName;
    if (n.familyName) data.familyName = n.familyName;
    if (n.additionalNames) data.middleNames = n.additionalNames.split(',');
    if (n.honorificPrefixes) data.honorificPrefix = n.honorificPrefixes;
    if (n.honorificSuffixes) data.honorificSuffix = n.honorificSuffixes;
  }

  if (fn) data.displayName = fn;
  if (nickname) data.nicknames = nickname.split(',');

  // Birth date
  if (bday) {
    const dateMatch = bday.match(/^(\d{4})-?(\d{2})?-?(\d{2})?/);
    if (dateMatch) {
      data.dateOfBirth = {
        year: parseInt(dateMatch[1]),
        month: dateMatch[2] ? parseInt(dateMatch[2]) : undefined,
        day: dateMatch[3] ? parseInt(dateMatch[3]) : undefined
      };
    }
  }

  // Photo
  if (photo) {
    data.profilePhoto = {
      url: photo.params.VALUE === 'URI' ? photo.value : undefined,
      data: photo.params.ENCODING === 'b' || photo.params.ENCODING === 'BASE64' ? photo.value : undefined,
      mimeType: photo.params.TYPE || 'image/jpeg'
    };
  }

  // Organization
  if (org) {
    data.organization = {
      name: org[0],
      department: org[1],
      division: org[2]
    };
  }

  if (title) data.jobTitle = title;

  return {
    card_id: `${personId}-identity`,
    person_id: personId,
    owner_user_id: options.ownerId,
    card_type: 'personal_identity',
    data,
    provenance: {
      source: options.source || 'vcf_import',
      confidence: options.confidence || 0.9,
      precedence: 'imported',
      importedAt: timestamp
    },
    version: '1.0.0'
  };
}

/**
 * Create email cards
 */
function createEmailCards(
  vcard: ParsedVCard,
  personId: string,
  options: AdapterOptions,
  timestamp: string,
  mapping: any
): CardEnvelope[] {
  const emailProps = getProperties(vcard, 'EMAIL');
  const cards: CardEnvelope[] = [];

  for (let i = 0; i < emailProps.length; i++) {
    const prop = emailProps[i];
    const emailMatch = prop.value.match(/^([^@]+)@(.+)$/);
    
    if (!emailMatch) continue;

    const labels = extractLabels(prop);
    const isPrimary = prop.params.PREF === 'true' || prop.params.PREF === '1' || i === 0;

    cards.push({
      card_id: `${personId}-email-${i}`,
      person_id: personId,
      owner_user_id: options.ownerId,
      card_type: 'email',
      data: {
        username: emailMatch[1],
        domain: emailMatch[2],
        fullAddress: prop.value,
        labels,
        isPrimary
      },
      provenance: {
        source: options.source || 'vcf_import',
        confidence: options.confidence || 0.9,
        precedence: 'imported',
        importedAt: timestamp
      },
      version: '1.0.0'
    });
  }

  return cards;
}

/**
 * Create phone cards
 */
function createPhoneCards(
  vcard: ParsedVCard,
  personId: string,
  options: AdapterOptions,
  timestamp: string,
  mapping: any
): CardEnvelope[] {
  const phoneProps = getProperties(vcard, 'TEL');
  const cards: CardEnvelope[] = [];

  for (let i = 0; i < phoneProps.length; i++) {
    const prop = phoneProps[i];
    const labels = extractLabels(prop);
    const isPrimary = prop.params.PREF === 'true' || prop.params.PREF === '1' || i === 0;

    // Parse phone number (basic parsing - could be enhanced with libphonenumber)
    const cleaned = prop.value.replace(/\D/g, '');
    const phoneData: any = {
      fullNumber: prop.value,
      labels,
      isPrimary
    };

    // Simple US number parsing (placeholder for more sophisticated parsing)
    if (cleaned.length === 10) {
      phoneData.countryCode = '1';
      phoneData.areaCode = cleaned.substring(0, 3);
      phoneData.exchange = cleaned.substring(3, 6);
      phoneData.lineNumber = cleaned.substring(6);
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      phoneData.countryCode = '1';
      phoneData.areaCode = cleaned.substring(1, 4);
      phoneData.exchange = cleaned.substring(4, 7);
      phoneData.lineNumber = cleaned.substring(7);
    }

    cards.push({
      card_id: `${personId}-phone-${i}`,
      person_id: personId,
      owner_user_id: options.ownerId,
      card_type: 'phone',
      data: phoneData,
      provenance: {
        source: options.source || 'vcf_import',
        confidence: options.confidence || 0.9,
        precedence: 'imported',
        importedAt: timestamp
      },
      version: '1.0.0'
    });
  }

  return cards;
}

/**
 * Create address cards
 */
function createAddressCards(
  vcard: ParsedVCard,
  personId: string,
  options: AdapterOptions,
  timestamp: string,
  mapping: any
): CardEnvelope[] {
  const adrProps = getProperties(vcard, 'ADR');
  const cards: CardEnvelope[] = [];

  for (let i = 0; i < adrProps.length; i++) {
    const prop = adrProps[i];
    const parts = prop.value.split(';');
    const labels = extractLabels(prop);
    const isPrimary = prop.params.PREF === 'true' || prop.params.PREF === '1' || i === 0;

    const data: any = {
      labels,
      isPrimary
    };

    // ADR format: POBox;Extended;Street;City;Region;PostalCode;Country
    if (parts[0]) data.poBox = parts[0];
    if (parts[1]) data.extendedAddress = parts[1];
    if (parts[2]) data.streetAddress = parts[2];
    if (parts[3]) data.locality = parts[3];
    if (parts[4]) data.region = parts[4];
    if (parts[5]) data.postalCode = parts[5];
    if (parts[6]) data.country = parts[6];

    cards.push({
      card_id: `${personId}-address-${i}`,
      person_id: personId,
      owner_user_id: options.ownerId,
      card_type: 'address',
      data,
      provenance: {
        source: options.source || 'vcf_import',
        confidence: options.confidence || 0.9,
        precedence: 'imported',
        importedAt: timestamp
      },
      version: '1.0.0'
    });
  }

  return cards;
}

/**
 * Extract labels from vCard property parameters
 */
function extractLabels(prop: VCardProperty): string[] {
  const labels: string[] = [];

  if (prop.params.TYPE) {
    const types = prop.params.TYPE.split(',');
    labels.push(...types.map(t => t.toLowerCase()));
  }

  // Apple custom labels (X-ABLabel)
  if (prop.group) {
    const labelProp = `${prop.group}.X-ABLabel`;
    // Would need access to full vCard properties - simplified for now
  }

  return labels.length > 0 ? labels : ['other'];
}
