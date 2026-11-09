/**
 * Centralized API endpoints registry.
 * Prevents magic strings across services, components, and templates.
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    SETUP_STATUS: '/auth/setup-status',
    SETUP_ADMIN: '/auth/setup-admin',
    USERS: '/auth/users',
    USER_BY_ID: (id: string) => `/auth/users/${id}`,
    USER_RESET_PASSWORD: (id: string) => `/auth/users/${id}/reset-password`,
    ROLES: '/auth/roles',
    ROLE_BY_ID: (id: string) => `/auth/roles/${id}`,
    ROLE_PERMISSIONS: (id: string) => `/auth/roles/${id}/permissions`,
    PERMISSIONS: '/auth/permissions'
  },
  CASES: {
    BASE: '/cases',
    BY_ID: (id: string) => `/cases/${id}`,
    CLOSE: (id: string) => `/cases/${id}/close`,
    REOPEN: (id: string) => `/cases/${id}/reopen`,
    ASSIGN: (id: string) => `/cases/${id}/assign`,
    UNASSIGN: (id: string, userId: string) => `/cases/${id}/assign/${userId}`,
    STAGE: (id: string) => `/cases/${id}/stage`,
    PARTIES: (id: string) => `/cases/${id}/parties`
  },
  CLIENTS: {
    BASE: '/clients',
    BY_ID: (id: string) => `/clients/${id}`,
    CONFLICT_CHECK: '/clients/conflicts/check',
    CONTACTS: (clientId: string) => `/clients/${clientId}/contacts`,
    CONTACT_BY_ID: (clientId: string, contactId: string) => `/clients/${clientId}/contacts/${contactId}`
  },
  HEARINGS: {
    BASE: '/hearings',
    BY_ID: (id: string) => `/hearings/${id}`,
    CAUSE_LIST: '/hearings/cause-list',
    RESCHEDULE: (id: string) => `/hearings/${id}/reschedule`,
    PROCEEDING: (id: string) => `/hearings/${id}/proceeding`,
    COURTS: '/hearings/courts',
    JUDGES: '/hearings/judges'
  },
  TASKS: {
    BASE: '/tasks',
    BY_ID: (id: string) => `/tasks/${id}`
  },
  DOCUMENTS: {
    BASE: '/documents',
    BY_ID: (id: string) => `/documents/${id}`,
    UPLOAD: '/documents/upload',
    DOWNLOAD: (id: string) => `/documents/${id}/download`,
    REFERENCES: '/documents/research/references'
  },
  FINANCE: {
    INVOICES: '/finance/invoices',
    INVOICE_BY_ID: (id: string) => `/finance/invoices/${id}`,
    INVOICE_CANCEL: (id: string) => `/finance/invoices/${id}/cancel`,
    INVOICE_PAYMENTS: (id: string) => `/finance/invoices/${id}/payments`,
    PAYMENTS: '/finance/payments',
    PAYMENT_REVERSE: (id: string) => `/finance/payments/${id}/reverse`,
    EXPENSES: '/finance/expenses',
    EXPENSE_BY_ID: (id: string) => `/finance/expenses/${id}`
  },
  DASHBOARD: {
    METRICS: '/dashboard'
  },
  SYSTEM: {
    CONFIG: '/config',
    INFO: '/system/info',
    SETTINGS: '/system/settings',
    AUDIT: '/system/audit',
    AUDIT_LOGS: '/system/audit-logs',
    DEPARTMENTS: '/system/departments',
    DEPARTMENT_BY_ID: (id: string) => `/system/departments/${id}`,
    PRACTICE_AREAS: '/system/practice-areas',
    PRACTICE_AREA_BY_ID: (id: string) => `/system/practice-areas/${id}`,
    CALENDAR_EVENTS: '/system/calendar/events',
    CALENDAR_EVENT_BY_ID: (id: string) => `/system/calendar/events/${id}`,
    REPORTS: '/system/reports',
    REPORTS_EXPORT: '/system/reports/export',
    NOTIFICATIONS: '/system/notifications',
    NOTIFICATION_READ: (id: string) => `/system/notifications/${id}/read`,
    BACKUP: '/system/backup',
    RESTORE: '/system/restore',
    DEMO_RESET: '/system/demo-reset'
  }
} as const;

