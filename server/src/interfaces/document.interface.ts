import { IPaginationOptions } from './pagination.interface.js';

export interface IDocumentFilter extends IPaginationOptions {
  workspaceId: string;
  caseId?: string;
  category?: string;
  search?: string;
}

export interface ICreateDocumentDto {
  title: string;
  category: string;
  caseId?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  confidentialityLevel?: string;
  description?: string;
  isPrivileged?: boolean;
  tags?: string;
}

