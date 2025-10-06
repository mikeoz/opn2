/**
 * CardEnvelope to vCard Export
 * Converts CardEnvelope format back to vCard 3.0
 */

import { CardEnvelope } from './adapter';

export interface ExportOptions {
  version?: '3.0' | '4.0';
  includePhoto?: boolean;
  foldLines?: boolean;
}

/**
 * Export multiple CardEnvelopes for same person to a single vCard
 */
export function cardEnvelopesToVCard(
  envelopes: CardEnvelope[],
  options: ExportOptions = {}
): string {
  if (envelopes.length === 0) return '';

  const version = options.version || '3.0';
  const lines: string[] = [];

  lines.push('BEGIN:VCARD');
  lines.push(`VERSION:${version}`);

  // Group envelopes by person_id
  const personId = envelopes[0].person_id;
  const personEnvelopes = envelopes.filter(e => e.person_id === personId);

  // Add personal identity fields
  const identityCard = personEnvelopes.find(e => e.card_type === 'personal_identity');
  if (identityCard) {
    addPersonalIdentityFields(lines, identityCard, options);
  }

  // Add email fields
  const emailCards = personEnvelopes.filter(e => e.card_type === 'email');
  for (const emailCard of emailCards) {
    addEmailField(lines, emailCard);
  }

  // Add phone fields
  const phoneCards = personEnvelopes.filter(e => e.card_type === 'phone');
  for (const phoneCard of phoneCards) {
    addPhoneField(lines, phoneCard);
  }

  // Add address fields
  const addressCards = personEnvelopes.filter(e => e.card_type === 'address');
  for (const addressCard of addressCards) {
    addAddressField(lines, addressCard);
  }

  // Add REV (revision timestamp)
  lines.push(`REV:${new Date().toISOString()}`);

  lines.push('END:VCARD');

  let vcard = lines.join('\r\n');

  // Fold lines if requested (max 75 chars)
  if (options.foldLines !== false) {
    vcard = foldVCardLines(vcard);
  }

  return vcard;
}

/**
 * Export array of person groups to VCF file content
 */
export function exportToVCF(
  envelopeGroups: CardEnvelope[][],
  options: ExportOptions = {}
): string {
  return envelopeGroups
    .map(group => cardEnvelopesToVCard(group, options))
    .join('\r\n');
}

/**
 * Add personal identity fields to vCard
 */
function addPersonalIdentityFields(
  lines: string[],
  envelope: CardEnvelope,
  options: ExportOptions
): void {
  const data = envelope.data;

  // FN (formatted name) - required
  if (data.displayName) {
    lines.push(`FN:${escapeVCardValue(data.displayName)}`);
  } else if (data.givenName || data.familyName) {
    const fn = [data.givenName, data.familyName].filter(Boolean).join(' ');
    lines.push(`FN:${escapeVCardValue(fn)}`);
  }

  // N (structured name)
  if (data.familyName || data.givenName) {
    const n = [
      data.familyName || '',
      data.givenName || '',
      Array.isArray(data.middleNames) ? data.middleNames.join(',') : (data.middleNames || ''),
      data.honorificPrefix || '',
      data.honorificSuffix || ''
    ].join(';');
    lines.push(`N:${escapeVCardValue(n)}`);
  }

  // NICKNAME
  if (data.nicknames) {
    const nicknames = Array.isArray(data.nicknames) 
      ? data.nicknames.join(',')
      : data.nicknames;
    lines.push(`NICKNAME:${escapeVCardValue(nicknames)}`);
  }

  // BDAY (birthday)
  if (data.dateOfBirth) {
    const dob = data.dateOfBirth;
    const year = String(dob.year).padStart(4, '0');
    const month = dob.month ? String(dob.month).padStart(2, '0') : '';
    const day = dob.day ? String(dob.day).padStart(2, '0') : '';
    
    if (month && day) {
      lines.push(`BDAY:${year}-${month}-${day}`);
    } else if (month) {
      lines.push(`BDAY:${year}-${month}`);
    } else {
      lines.push(`BDAY:${year}`);
    }
  }

  // PHOTO
  if (data.profilePhoto && options.includePhoto !== false) {
    if (data.profilePhoto.url) {
      lines.push(`PHOTO;VALUE=URI:${data.profilePhoto.url}`);
    } else if (data.profilePhoto.data) {
      const type = data.profilePhoto.mimeType || 'image/jpeg';
      lines.push(`PHOTO;ENCODING=b;TYPE=${type}:${data.profilePhoto.data}`);
    }
  }

  // ORG (organization)
  if (data.organization) {
    const org = [
      data.organization.name || '',
      data.organization.department || '',
      data.organization.division || ''
    ].join(';');
    lines.push(`ORG:${escapeVCardValue(org)}`);
  }

  // TITLE (job title)
  if (data.jobTitle) {
    lines.push(`TITLE:${escapeVCardValue(data.jobTitle)}`);
  }
}

/**
 * Add email field to vCard
 */
function addEmailField(lines: string[], envelope: CardEnvelope): void {
  const data = envelope.data;
  
  if (!data.fullAddress) return;

  const params: string[] = [];
  
  // Add TYPE parameters from labels
  if (data.labels && data.labels.length > 0) {
    const types = data.labels.map((l: string) => l.toUpperCase()).join(',');
    params.push(`TYPE=${types}`);
  }

  // Add PREF if primary
  if (data.isPrimary) {
    params.push('PREF=1');
  }

  const paramStr = params.length > 0 ? `;${params.join(';')}` : '';
  lines.push(`EMAIL${paramStr}:${escapeVCardValue(data.fullAddress)}`);
}

/**
 * Add phone field to vCard
 */
function addPhoneField(lines: string[], envelope: CardEnvelope): void {
  const data = envelope.data;
  
  if (!data.fullNumber) return;

  const params: string[] = ['VOICE']; // Default to VOICE type
  
  // Add TYPE parameters from labels
  if (data.labels && data.labels.length > 0) {
    const types = data.labels
      .map((l: string) => {
        // Map our labels back to vCard types
        const labelMap: Record<string, string> = {
          'mobile': 'CELL',
          'work': 'WORK',
          'home': 'HOME',
          'fax': 'FAX'
        };
        return labelMap[l.toLowerCase()] || l.toUpperCase();
      });
    params.push(...types);
  }

  // Add PREF if primary
  if (data.isPrimary) {
    params.push('PREF=1');
  }

  const paramStr = params.length > 0 ? `;TYPE=${params.join(',')}` : '';
  lines.push(`TEL${paramStr}:${escapeVCardValue(data.fullNumber)}`);
}

/**
 * Add address field to vCard
 */
function addAddressField(lines: string[], envelope: CardEnvelope): void {
  const data = envelope.data;

  const adr = [
    data.poBox || '',
    data.extendedAddress || '',
    data.streetAddress || '',
    data.locality || '',
    data.region || '',
    data.postalCode || '',
    data.country || ''
  ].join(';');

  const params: string[] = [];
  
  // Add TYPE parameters from labels
  if (data.labels && data.labels.length > 0) {
    const types = data.labels.map((l: string) => l.toUpperCase()).join(',');
    params.push(`TYPE=${types}`);
  }

  // Add PREF if primary
  if (data.isPrimary) {
    params.push('PREF=1');
  }

  const paramStr = params.length > 0 ? `;${params.join(';')}` : '';
  lines.push(`ADR${paramStr}:${escapeVCardValue(adr)}`);
}

/**
 * Escape special characters in vCard values
 */
function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Fold long lines to 75 characters (vCard 3.0 spec)
 */
function foldVCardLines(vcard: string): string {
  const lines = vcard.split('\r\n');
  const folded: string[] = [];

  for (const line of lines) {
    if (line.length <= 75) {
      folded.push(line);
    } else {
      // First line gets 75 chars
      folded.push(line.substring(0, 75));
      
      // Continuation lines get 74 chars (1 space + 74 chars)
      let remaining = line.substring(75);
      while (remaining.length > 74) {
        folded.push(' ' + remaining.substring(0, 74));
        remaining = remaining.substring(74);
      }
      
      if (remaining.length > 0) {
        folded.push(' ' + remaining);
      }
    }
  }

  return folded.join('\r\n');
}

/**
 * Download vCard as file
 */
export function downloadVCard(vcardContent: string, filename: string = 'contact.vcf'): void {
  const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Group CardEnvelopes by person_id for export
 */
export function groupCardEnvelopesByPerson(envelopes: CardEnvelope[]): CardEnvelope[][] {
  const groups = new Map<string, CardEnvelope[]>();

  for (const envelope of envelopes) {
    const personId = envelope.person_id;
    if (!groups.has(personId)) {
      groups.set(personId, []);
    }
    groups.get(personId)!.push(envelope);
  }

  return Array.from(groups.values());
}
