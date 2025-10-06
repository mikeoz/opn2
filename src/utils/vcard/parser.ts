/**
 * vCard 3.0 Parser with Apple Contact Extensions
 * Parses VCF files into structured CardEnvelope format
 */

import { v4 as uuidv4 } from 'uuid';

export interface VCardProperty {
  name: string;
  value: string;
  params: Record<string, string>;
  group?: string;
}

export interface ParsedVCard {
  properties: VCardProperty[];
  version: string;
  rawText: string;
}

export interface ParseOptions {
  strict?: boolean;
  preserveExtensions?: boolean;
  encoding?: string;
}

/**
 * Parse a single vCard from text
 */
export function parseVCard(vcfText: string, options: ParseOptions = {}): ParsedVCard {
  const lines = unfoldLines(vcfText);
  const properties: VCardProperty[] = [];
  let version = '3.0';

  for (const line of lines) {
    if (!line.trim()) continue;

    const property = parseProperty(line);
    if (!property) continue;

    properties.push(property);

    if (property.name === 'VERSION') {
      version = property.value;
    }
  }

  return {
    properties,
    version,
    rawText: vcfText
  };
}

/**
 * Parse multiple vCards from a VCF file
 */
export function parseVCards(vcfText: string, options: ParseOptions = {}): ParsedVCard[] {
  const vcards: ParsedVCard[] = [];
  const vcardBlocks = splitVCards(vcfText);

  for (const block of vcardBlocks) {
    try {
      const vcard = parseVCard(block, options);
      vcards.push(vcard);
    } catch (error) {
      console.error('Failed to parse vCard block:', error);
      if (options.strict) throw error;
    }
  }

  return vcards;
}

/**
 * Split VCF text into individual vCard blocks
 */
function splitVCards(vcfText: string): string[] {
  const blocks: string[] = [];
  const lines = vcfText.split(/\r?\n/);
  let currentBlock: string[] = [];
  let inVCard = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === 'BEGIN:VCARD') {
      inVCard = true;
      currentBlock = [line];
    } else if (trimmed === 'END:VCARD') {
      currentBlock.push(line);
      blocks.push(currentBlock.join('\n'));
      currentBlock = [];
      inVCard = false;
    } else if (inVCard) {
      currentBlock.push(line);
    }
  }

  return blocks;
}

/**
 * Unfold continuation lines (lines starting with space/tab)
 */
function unfoldLines(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const unfolded: string[] = [];
  let current = '';

  for (const line of lines) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      // Continuation line - append to current
      current += line.substring(1);
    } else {
      if (current) {
        unfolded.push(current);
      }
      current = line;
    }
  }

  if (current) {
    unfolded.push(current);
  }

  return unfolded;
}

/**
 * Parse a single vCard property line
 */
function parseProperty(line: string): VCardProperty | null {
  if (line.startsWith('BEGIN:') || line.startsWith('END:')) {
    return null;
  }

  // Extract group if present (e.g., "item1.TEL:...")
  let group: string | undefined;
  let remainder = line;
  
  const groupMatch = line.match(/^([^.:]+)\.(.*)/);
  if (groupMatch) {
    group = groupMatch[1];
    remainder = groupMatch[2];
  }

  // Split name and value at first unescaped colon
  const colonIndex = remainder.indexOf(':');
  if (colonIndex === -1) {
    console.warn('Invalid property line (no colon):', line);
    return null;
  }

  const nameAndParams = remainder.substring(0, colonIndex);
  const value = remainder.substring(colonIndex + 1);

  // Parse name and parameters
  const { name, params } = parseNameAndParams(nameAndParams);

  // Decode value based on encoding parameter
  const decodedValue = decodeValue(value, params);

  return {
    name: name.toUpperCase(),
    value: decodedValue,
    params,
    group
  };
}

/**
 * Parse property name and parameters
 */
function parseNameAndParams(nameAndParams: string): { name: string; params: Record<string, string> } {
  const parts = nameAndParams.split(';');
  const name = parts[0];
  const params: Record<string, string> = {};

  for (let i = 1; i < parts.length; i++) {
    const param = parts[i];
    const eqIndex = param.indexOf('=');
    
    if (eqIndex === -1) {
      // Parameter without value (e.g., "PREF")
      params[param.toUpperCase()] = 'true';
    } else {
      const paramName = param.substring(0, eqIndex).toUpperCase();
      let paramValue = param.substring(eqIndex + 1);
      
      // Remove quotes if present
      if (paramValue.startsWith('"') && paramValue.endsWith('"')) {
        paramValue = paramValue.substring(1, paramValue.length - 1);
      }
      
      params[paramName] = paramValue;
    }
  }

  return { name, params };
}

/**
 * Decode property value based on encoding
 */
function decodeValue(value: string, params: Record<string, string>): string {
  const encoding = params.ENCODING?.toUpperCase();

  if (encoding === 'QUOTED-PRINTABLE') {
    return decodeQuotedPrintable(value);
  }

  if (encoding === 'BASE64' || encoding === 'B') {
    // For binary data, keep as-is (will be handled by adapter)
    return value;
  }

  // Unescape standard vCard escaping
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/**
 * Decode QUOTED-PRINTABLE encoding
 */
function decodeQuotedPrintable(value: string): string {
  return value.replace(/=([0-9A-F]{2})/gi, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  }).replace(/=\r?\n/g, ''); // Remove soft line breaks
}

/**
 * Get all properties with a specific name
 */
export function getProperties(vcard: ParsedVCard, name: string): VCardProperty[] {
  return vcard.properties.filter(p => p.name === name.toUpperCase());
}

/**
 * Get first property with a specific name
 */
export function getProperty(vcard: ParsedVCard, name: string): VCardProperty | undefined {
  return vcard.properties.find(p => p.name === name.toUpperCase());
}

/**
 * Get properties by group
 */
export function getPropertiesByGroup(vcard: ParsedVCard, group: string): VCardProperty[] {
  return vcard.properties.filter(p => p.group === group);
}

/**
 * Extract structured name components
 */
export function getStructuredName(vcard: ParsedVCard): {
  familyName?: string;
  givenName?: string;
  additionalNames?: string;
  honorificPrefixes?: string;
  honorificSuffixes?: string;
} | null {
  const nProp = getProperty(vcard, 'N');
  if (!nProp) return null;

  const parts = nProp.value.split(';');
  
  return {
    familyName: parts[0] || undefined,
    givenName: parts[1] || undefined,
    additionalNames: parts[2] || undefined,
    honorificPrefixes: parts[3] || undefined,
    honorificSuffixes: parts[4] || undefined
  };
}

/**
 * Validate vCard structure
 */
export function validateVCard(vcard: ParsedVCard): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for required VERSION property
  if (!getProperty(vcard, 'VERSION')) {
    errors.push('Missing required VERSION property');
  }

  // Check for at least one name property (FN or N)
  if (!getProperty(vcard, 'FN') && !getProperty(vcard, 'N')) {
    errors.push('Missing required FN or N property');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
