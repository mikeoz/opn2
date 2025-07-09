
export type TransactionControlType = 'read' | 'write' | 'share' | 'delete' | 'admin';
export type AccessPermissionType = 'view_basic' | 'view_detailed' | 'edit' | 'share' | 'delete' | 'admin';

export interface UserProviderRelationship {
  id: string;
  user_id: string;
  provider_id: string;
  relationship_type: string;
  status: string;
  access_permissions: Record<string, AccessPermissionType[]>;
  transaction_controls: Record<string, TransactionControlType[]>;
  created_at: string;
  updated_at: string;
}

export interface CardRelationship {
  id: string;
  card_id: string;
  shared_with_user_id?: string;
  shared_with_provider_id?: string;
  relationship_type: 'shared' | 'requested' | 'verified' | 'revoked' | 'member_of';
  permissions: Record<string, AccessPermissionType[]>;
  shared_at: string;
  expires_at?: string;
  created_by: string;
}

export interface RelationshipInteraction {
  id: string;
  relationship_id: string;
  interaction_type: string;
  interaction_data: Record<string, any>;
  created_at: string;
  created_by: string;
}

export const PERMISSION_LABELS: Record<AccessPermissionType, string> = {
  view_basic: 'View Basic Info',
  view_detailed: 'View Detailed Info',
  edit: 'Edit',
  share: 'Share',
  delete: 'Delete',
  admin: 'Admin Access'
};

export const TRANSACTION_CONTROL_LABELS: Record<TransactionControlType, string> = {
  read: 'Read Access',
  write: 'Write Access',
  share: 'Share Access',
  delete: 'Delete Access',
  admin: 'Admin Access'
};

export const hasPermission = (
  permissions: Record<string, AccessPermissionType[]>,
  resource: string,
  requiredPermission: AccessPermissionType
): boolean => {
  const resourcePermissions = permissions[resource] || [];
  return resourcePermissions.includes(requiredPermission) || resourcePermissions.includes('admin');
};

export const hasTransactionControl = (
  controls: Record<string, TransactionControlType[]>,
  resource: string,
  requiredControl: TransactionControlType
): boolean => {
  const resourceControls = controls[resource] || [];
  return resourceControls.includes(requiredControl) || resourceControls.includes('admin');
};
