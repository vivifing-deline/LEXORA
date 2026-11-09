import { UserRoleEnum } from '../enums/user-role.enum.js';

export const SYSTEM_ROLES = [
  {
    name: UserRoleEnum.FIRM_ADMIN,
    displayName: 'Firm Admin',
    description: 'Full administrative access to firm settings, users, and all records'
  },
  {
    name: UserRoleEnum.SENIOR_ADVOCATE,
    displayName: 'Senior Advocate',
    description: 'Principal litigator with full case management, billing, and approval rights'
  },
  {
    name: UserRoleEnum.ASSOCIATE,
    displayName: 'Associate Advocate',
    description: 'Case handler managing hearings, pleadings, research, and client tasks'
  },
  {
    name: UserRoleEnum.JUNIOR_ADVOCATE,
    displayName: 'Junior Advocate',
    description: 'Drafting, cause list tracking, case research, and client support'
  },
  {
    name: UserRoleEnum.CLERK,
    displayName: 'Clerk',
    description: 'Court filing, case diary updates, listing status, and physical document indexing'
  },
  {
    name: UserRoleEnum.ACCOUNTANT,
    displayName: 'Accountant',
    description: 'Fee collection, invoicing, trust ledger reconciliation, and expense tracking'
  },
  {
    name: UserRoleEnum.CLIENT,
    displayName: 'Client',
    description: 'Restricted portal access to view case status, invoices, and uploaded orders'
  }
] as const;

