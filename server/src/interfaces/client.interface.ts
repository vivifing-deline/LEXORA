import { ClientType } from '../enums/index.js';
import { IPaginationOptions } from './pagination.interface.js';

export interface IClientFilter extends IPaginationOptions {
  workspaceId: string;
  search?: string;
  type?: ClientType | string;
  status?: string;
  advocateId?: string;
}

export interface ICreateClientDto {
  name: string;
  clientReference?: string;
  type: ClientType | string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  jurisdiction?: string;
  cnicPassport?: string;
  assignedAdvocateId?: string;
  notes?: string;
  contacts?: Array<{
    name: string;
    designation?: string;
    email?: string;
    phone?: string;
    isPrimary?: boolean;
  }>;
}

export interface IUpdateClientDto extends Partial<ICreateClientDto> {
  status?: string;
}

export interface IConflictCheckDto {
  query: string;
}

