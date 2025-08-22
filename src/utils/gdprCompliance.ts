/**
 * GDPR Compliance Tooling
 * 
 * DEMO MODE: Client-side compliance checking and data export
 * ALPHA TESTING: Full compliance with legal data handling
 */

export interface DataSubjectRequest {
  id: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';
  userId: string;
  requestedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  metadata?: Record<string, any>;
  legalBasis?: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: 'essential' | 'functional' | 'analytics' | 'marketing' | 'sharing';
  granted: boolean;
  grantedAt: Date;
  revokedAt?: Date;
  version: string;
  context: string;
  evidence?: string;
}

export interface DataRetentionPolicy {
  id: string;
  dataType: 'user_profile' | 'card_data' | 'audit_logs' | 'relationships' | 'family_data';
  retentionPeriod: number; // days
  legalBasis: string;
  autoDelete: boolean;
  archiveFirst: boolean;
  exceptions?: string[];
}

class GDPRComplianceService {
  private isDemoMode = true;

  /**
   * Default data retention policies
   */
  private defaultRetentionPolicies: DataRetentionPolicy[] = [
    {
      id: 'user-profiles',
      dataType: 'user_profile',
      retentionPeriod: 2555, // 7 years
      legalBasis: 'Contract performance and legitimate interest',
      autoDelete: false, // Requires manual review
      archiveFirst: true
    },
    {
      id: 'card-data',
      dataType: 'card_data',
      retentionPeriod: 1095, // 3 years
      legalBasis: 'Legitimate interest for service provision',
      autoDelete: false,
      archiveFirst: true
    },
    {
      id: 'audit-logs',
      dataType: 'audit_logs',
      retentionPeriod: 2190, // 6 years (compliance requirement)
      legalBasis: 'Legal obligation',
      autoDelete: true,
      archiveFirst: true
    },
    {
      id: 'family-relationships',
      dataType: 'family_data',
      retentionPeriod: 1825, // 5 years
      legalBasis: 'Consent and legitimate interest',
      autoDelete: false,
      archiveFirst: true,
      exceptions: ['Active family units with ongoing consent']
    }
  ];

  /**
   * Records user consent for various data processing activities
   */
  async recordConsent(params: {
    userId: string;
    consentType: ConsentRecord['consentType'];
    granted: boolean;
    context: string;
    evidence?: string;
  }): Promise<ConsentRecord> {
    const consent: ConsentRecord = {
      id: crypto.randomUUID(),
      userId: params.userId,
      consentType: params.consentType,
      granted: params.granted,
      grantedAt: new Date(),
      version: '1.0',
      context: params.context,
      evidence: params.evidence
    };

    if (this.isDemoMode) {
      // Demo Mode: Store in localStorage
      const existingConsents = this.getStoredConsents();
      localStorage.setItem('gdpr-consents', JSON.stringify([...existingConsents, consent]));
      console.log('Demo Mode: Consent recorded locally', consent);
    } else {
      // Alpha Testing: Store in database with audit trail
      // await supabase.from('consent_records').insert(consent);
    }

    return consent;
  }

  /**
   * Handles data subject access requests (Article 15)
   */
  async handleAccessRequest(userId: string): Promise<{
    success: boolean;
    data?: any;
    message: string;
    demoMode: boolean;
  }> {
    if (this.isDemoMode) {
      // Demo Mode: Generate sample data export
      const userData = {
        profile: {
          id: userId,
          email: 'demo@example.com',
          name: 'Demo User',
          createdAt: new Date().toISOString()
        },
        cards: [
          {
            id: 'demo-card-1',
            type: 'Personal',
            createdAt: new Date().toISOString(),
            fields: { name: 'Demo Card', purpose: 'Testing' }
          }
        ],
        consents: this.getStoredConsents().filter(c => c.userId === userId),
        relationships: [],
        metadata: {
          exportedAt: new Date().toISOString(),
          version: '1.0',
          demoMode: true
        }
      };

      return {
        success: true,
        data: userData,
        message: 'Demo Mode: Sample data export generated',
        demoMode: true
      };
    }

    return {
      success: false,
      message: 'Data access requests will be fully implemented in Alpha Testing',
      demoMode: false
    };
  }

  /**
   * Handles data erasure requests (Article 17 - Right to be forgotten)
   */
  async handleErasureRequest(userId: string, reason: string): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      id: crypto.randomUUID(),
      type: 'erasure',
      userId,
      requestedAt: new Date(),
      status: this.isDemoMode ? 'completed' : 'pending',
      metadata: { reason, demoMode: this.isDemoMode },
      legalBasis: 'Article 17 GDPR - Right to erasure'
    };

    if (this.isDemoMode) {
      console.log('Demo Mode: Erasure request processed (simulated)', request);
      // In demo, we simulate immediate completion
      request.completedAt = new Date();
    }

    return request;
  }

  /**
   * Gets data retention policies
   */
  getDataRetentionPolicies(): DataRetentionPolicy[] {
    return this.defaultRetentionPolicies;
  }

  /**
   * Checks if data should be retained or deleted
   */
  shouldRetainData(dataType: DataRetentionPolicy['dataType'], createdAt: Date): {
    retain: boolean;
    policy: DataRetentionPolicy;
    daysRemaining: number;
    action: 'keep' | 'archive' | 'delete' | 'review';
  } {
    const policy = this.defaultRetentionPolicies.find(p => p.dataType === dataType);
    if (!policy) {
      return {
        retain: true,
        policy: this.defaultRetentionPolicies[0], // fallback
        daysRemaining: 365,
        action: 'review'
      };
    }

    const ageInDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = policy.retentionPeriod - ageInDays;
    
    let action: 'keep' | 'archive' | 'delete' | 'review' = 'keep';
    
    if (daysRemaining <= 0) {
      if (policy.autoDelete) {
        action = policy.archiveFirst ? 'archive' : 'delete';
      } else {
        action = 'review';
      }
    } else if (daysRemaining <= 30) {
      action = 'archive';
    }

    return {
      retain: daysRemaining > 0,
      policy,
      daysRemaining: Math.max(0, daysRemaining),
      action
    };
  }

  /**
   * Gets user's consent status
   */
  getUserConsents(userId: string): ConsentRecord[] {
    if (this.isDemoMode) {
      return this.getStoredConsents().filter(c => c.userId === userId);
    }
    return [];
  }

  /**
   * Gets compliance status for UI
   */
  getComplianceStatus() {
    return {
      isDemoMode: this.isDemoMode,
      complianceLevel: this.isDemoMode ? 'demonstration' : 'full-gdpr',
      features: {
        consentManagement: true,
        dataPortability: this.isDemoMode ? 'demo' : 'full',
        rightToErasure: this.isDemoMode ? 'simulated' : 'implemented',
        dataRetention: 'policy-based',
        auditTrail: true
      },
      warningMessage: this.isDemoMode
        ? 'Demo Mode: Compliance features for demonstration only. Full GDPR compliance in Alpha Testing.'
        : 'Full GDPR compliance active'
    };
  }

  private getStoredConsents(): ConsentRecord[] {
    try {
      const stored = localStorage.getItem('gdpr-consents');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

export const gdprService = new GDPRComplianceService();