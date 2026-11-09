export const PERMISSIONS = {
  // Cases
  CASE_VIEW: 'case.view',
  CASE_CREATE: 'case.create',
  CASE_EDIT: 'case.edit',
  CASE_DELETE: 'case.delete',
  CASE_ASSIGN: 'case.assign',
  CASE_CLOSE: 'case.close',

  // Clients
  CLIENT_VIEW: 'client.view',
  CLIENT_CREATE: 'client.create',
  CLIENT_EDIT: 'client.edit',
  CLIENT_DELETE: 'client.delete',

  // Documents
  DOCUMENT_VIEW: 'document.view',
  DOCUMENT_UPLOAD: 'document.upload',
  DOCUMENT_DOWNLOAD: 'document.download',
  DOCUMENT_DELETE: 'document.delete',

  // Hearings
  HEARING_VIEW: 'hearing.view',
  HEARING_CREATE: 'hearing.create',
  HEARING_EDIT: 'hearing.edit',
  HEARING_DELETE: 'hearing.delete',

  // Tasks
  TASK_VIEW: 'task.view',
  TASK_CREATE: 'task.create',
  TASK_EDIT: 'task.edit',
  TASK_DELETE: 'task.delete',

  // Billing & Finance
  BILLING_VIEW: 'billing.view',
  BILLING_CREATE: 'billing.create',
  BILLING_MANAGE_PAYMENTS: 'billing.manage_payments',

  // Administration
  USER_MANAGE: 'user.manage',
  ROLE_MANAGE: 'role.manage',
  PERMISSION_MANAGE: 'permission.manage',
  AUDIT_VIEW: 'audit.view'
} as const;

export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS];

