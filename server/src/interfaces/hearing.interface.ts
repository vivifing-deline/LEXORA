import { HearingStatus } from '../enums/index.js';
import { IPaginationOptions } from './pagination.interface.js';

export interface IHearingFilter extends IPaginationOptions {
  workspaceId: string;
  userId?: string;
  isClient?: boolean;
  caseId?: string;
  courtId?: string;
  status?: HearingStatus | string;
  startDate?: string | Date;
  endDate?: string | Date;
}

export interface ICreateHearingDto {
  caseId: string;
  courtId?: string;
  judgeId?: string;
  assignedAdvocateId?: string;
  hearingDate: string | Date;
  purpose: string;
  courtRoom?: string;
  bench?: string;
  causeListSerialNo?: string;
  notes?: string;
}

export interface IUpdateHearingDto extends Partial<ICreateHearingDto> {
  status?: HearingStatus | string;
  outcome?: string;
  proceedingsSummary?: string;
  nextHearingDate?: string | Date;
  nextHearingPurpose?: string;
}

