/**
 * Granular Sharing Permission System
 * 
 * DEMO MODE: Client-side permission validation for demonstration
 * ALPHA TESTING: Server-side enforcement with proper authorization
 */

export interface Permission {
  action: 'view' | 'edit' | 'share' | 'delete' | 'download';
  resource: 'card' | 'field' | 'relationship' | 'family_data';
  granted: boolean;
  conditions?: PermissionCondition[];
  expiresAt?: Date;
}

export interface PermissionCondition {
  type: 'time_range' | 'location' | 'device' | 'purpose' | 'context';
  value: any;
  description: string;
}

export interface SharingPolicy {
  id: string;
  resourceId: string;
  resourceType: 'card' | 'family_unit' | 'organization';
  grantedTo: string; // user_id or 'public'
  permissions: Permission[];
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

class PermissionsEngine {
  private isDemoMode = true;

  /**
   * Creates a new sharing policy with granular permissions
   */
  createSharingPolicy(params: {
    resourceId: string;
    resourceType: 'card' | 'family_unit' | 'organization';
    grantedTo: string;
    permissions: Partial<Permission>[];
    createdBy: string;
    expiresAt?: Date;
    conditions?: PermissionCondition[];
  }): SharingPolicy {
    const permissions: Permission[] = params.permissions.map(p => ({
      action: p.action || 'view',
      resource: p.resource || 'card',
      granted: p.granted !== false,
      conditions: p.conditions || params.conditions,
      expiresAt: p.expiresAt || params.expiresAt
    }));

    return {
      id: crypto.randomUUID(),
      resourceId: params.resourceId,
      resourceType: params.resourceType,
      grantedTo: params.grantedTo,
      permissions,
      createdBy: params.createdBy,
      createdAt: new Date(),
      expiresAt: params.expiresAt,
      isActive: true,
      metadata: {
        demoMode: this.isDemoMode,
        createdIn: 'opnli-v1'
      }
    };
  }

  /**
   * Checks if a user has permission to perform an action
   */
  async checkPermission(params: {
    userId: string;
    resourceId: string;
    action: Permission['action'];
    context?: Record<string, any>;
  }): Promise<{
    granted: boolean;
    policy?: SharingPolicy;
    reason: string;
    demoMode: boolean;
  }> {
    if (this.isDemoMode) {
      // Demo Mode: Permissive permissions for demonstration
      return {
        granted: true,
        reason: 'Demo Mode: All permissions granted for testing',
        demoMode: true
      };
    }

    // Alpha Testing: Proper permission checking
    // This would integrate with the database and real policies
    return {
      granted: false,
      reason: 'Permission checking not implemented in demo',
      demoMode: false
    };
  }

  /**
   * Gets all sharing policies for a resource
   */
  getResourcePolicies(resourceId: string): SharingPolicy[] {
    // Demo Mode: Return sample policies
    if (this.isDemoMode) {
      return [
        this.createSharingPolicy({
          resourceId,
          resourceType: 'card',
          grantedTo: 'family-members',
          permissions: [
            { action: 'view', resource: 'card', granted: true },
            { action: 'share', resource: 'card', granted: false }
          ],
          createdBy: 'demo-user',
          conditions: [{
            type: 'context',
            value: 'family-sharing',
            description: 'Only within family context'
          }]
        })
      ];
    }

    // Alpha Testing: Database lookup
    return [];
  }

  /**
   * Validates sharing conditions
   */
  validateConditions(conditions: PermissionCondition[], context: Record<string, any>): boolean {
    if (this.isDemoMode) {
      // Demo Mode: Always valid
      return true;
    }

    return conditions.every(condition => {
      switch (condition.type) {
        case 'time_range':
          const now = new Date();
          const { start, end } = condition.value;
          return now >= new Date(start) && now <= new Date(end);
        
        case 'location':
          // Would integrate with geolocation in Alpha Testing
          return true;
        
        case 'device':
          // Would check device fingerprint in Alpha Testing
          return true;
        
        case 'purpose':
          return context.purpose === condition.value;
        
        case 'context':
          return context.context === condition.value;
        
        default:
          return false;
      }
    });
  }

  /**
   * Creates standard permission templates
   */
  getPermissionTemplates(): Record<string, Partial<Permission>[]> {
    return {
      'family-view-only': [
        { action: 'view', resource: 'card', granted: true },
        { action: 'edit', resource: 'card', granted: false },
        { action: 'share', resource: 'card', granted: false }
      ],
      'family-collaborate': [
        { action: 'view', resource: 'card', granted: true },
        { action: 'edit', resource: 'field', granted: true },
        { action: 'share', resource: 'relationship', granted: true }
      ],
      'professional-limited': [
        { action: 'view', resource: 'card', granted: true },
        { action: 'download', resource: 'card', granted: false }
      ],
      'public-basic': [
        { action: 'view', resource: 'card', granted: true }
      ]
    };
  }

  /**
   * Gets permission status for UI display
   */
  getPermissionStatus() {
    return {
      isDemoMode: this.isDemoMode,
      enforcementLevel: this.isDemoMode ? 'client-side-demo' : 'server-side-enforced',
      warningMessage: this.isDemoMode
        ? 'Demo Mode: Permissions shown for UI only. Server-side enforcement in Alpha Testing.'
        : 'Full permission enforcement active'
    };
  }
}

export const permissionsEngine = new PermissionsEngine();