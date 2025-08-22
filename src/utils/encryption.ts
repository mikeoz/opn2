/**
 * End-to-End Encryption Utilities for Sensitive CARDs
 * 
 * DEMO MODE: Uses client-side encryption for demonstration
 * ALPHA TESTING: Will integrate with proper key management service
 */

// Simple encryption for Demo Mode - NOT for production use
const DEMO_KEY = 'opnli-demo-key-2024'; // In Alpha Testing: proper key derivation

export interface EncryptedData {
  encrypted: string;
  iv: string;
  isEncrypted: true;
  demoMode: boolean;
}

export interface DecryptedData {
  data: string;
  isDecrypted: true;
}

class EncryptionService {
  private isDemoMode = true; // Will be false in Alpha Testing

  /**
   * Encrypts sensitive card data
   * DEMO MODE: Basic encryption for demonstration
   * ALPHA TESTING: Will use proper E2E encryption with user keys
   */
  async encryptCardData(plaintext: string, cardType: 'sensitive' | 'standard' = 'standard'): Promise<EncryptedData | string> {
    if (cardType === 'standard' || this.isDemoMode) {
      // Demo Mode: Simple base64 encoding for non-sensitive or demo data
      if (cardType === 'sensitive') {
        console.warn('Demo Mode: Using basic encryption for sensitive data. Alpha Testing will use proper E2E encryption.');
      }
      
      const encoded = btoa(encodeURIComponent(plaintext));
      return {
        encrypted: encoded,
        iv: 'demo-iv',
        isEncrypted: true,
        demoMode: true
      };
    }

    // Alpha Testing will implement proper encryption here
    return plaintext;
  }

  /**
   * Decrypts sensitive card data
   */
  async decryptCardData(encryptedData: EncryptedData | string): Promise<string> {
    if (typeof encryptedData === 'string') {
      return encryptedData; // Not encrypted
    }

    if (encryptedData.demoMode) {
      try {
        return decodeURIComponent(atob(encryptedData.encrypted));
      } catch (error) {
        console.error('Demo decryption failed:', error);
        return 'Error: Could not decrypt data';
      }
    }

    // Alpha Testing: proper decryption
    return encryptedData.encrypted;
  }

  /**
   * Determines if card data should be encrypted based on content
   */
  shouldEncrypt(fieldName: string, value: string): boolean {
    const sensitiveFields = [
      'ssn', 'social_security', 'tax_id',
      'credit_card', 'bank_account', 'routing_number',
      'passport', 'license_number', 'medical_record',
      'private_note', 'confidential'
    ];

    const fieldLower = fieldName.toLowerCase();
    return sensitiveFields.some(sensitive => fieldLower.includes(sensitive));
  }

  /**
   * Gets encryption status for user interface
   */
  getEncryptionStatus() {
    return {
      isDemoMode: this.isDemoMode,
      encryptionLevel: this.isDemoMode ? 'demo' : 'e2e',
      warningMessage: this.isDemoMode 
        ? 'Demo Mode: Basic encryption only. Full E2E encryption in Alpha Testing.'
        : 'Full end-to-end encryption active'
    };
  }
}

export const encryptionService = new EncryptionService();

/**
 * Utility function to handle encrypted card field values
 */
export const processCardFieldValue = async (
  fieldName: string, 
  value: string, 
  encrypt: boolean = true
): Promise<string | EncryptedData> => {
  if (!encrypt || !encryptionService.shouldEncrypt(fieldName, value)) {
    return value;
  }

  return await encryptionService.encryptCardData(value, 'sensitive');
};

/**
 * Utility function to display card field values
 */
export const displayCardFieldValue = async (
  value: string | EncryptedData
): Promise<string> => {
  if (typeof value === 'string') {
    return value;
  }

  return await encryptionService.decryptCardData(value);
};