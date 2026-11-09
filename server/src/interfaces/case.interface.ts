import { CaseStatus, CaseStage, Priority } from '../enums/index.js';
import { IPaginationOptions } from './pagination.interface.js';

export interface ICaseFilter extends IPaginationOptions {
  workspaceId: string;
  userId?: string;
  isClient?: boolean;
  search?: string;
  practiceAreaId?: string;
  status?: CaseStatus | string;
  stage?: CaseStage | string;
  priority?: Priority | string;
  courtId?: string;
  advocateId?: string;
}

export interface ICreateCaseDto {
  title: string;
  clientId: string;
  practiceAreaId: string;
  courtId?: string;
  judgeId?: string;
  courtCaseNumber?: string;
  internalReference?: string;
  plaintiffPetitioner: string;
  defendantRespondent: string;
  opposingCounsel?: string;
  currentStage?: CaseStage | string;
  status?: CaseStatus | string;
  priority?: Priority | string;
  filingDate?: string | Date;
  registrationDate?: string | Date;
  description?: string;
  financialAgreement?: string;
  importantNotes?: string;
  assignedLawyerIds?: string[];
  assignedClerkId?: string;
}

export interface IUpdateCaseDto extends Partial<ICreateCaseDto> {
  isArchived?: boolean;
}

export interface IAssignCaseDto {
  userId: string;
  roleInCase?: string;
  isLead?: boolean;
}

export interface IChangeCaseStageDto {
  stage: CaseStage | string;
  remarks?: string;
}

export interface IChangeCaseStatusDto {
  status: CaseStatus | string;
  remarks?: string;
}

