import { TaskStatus, Priority } from '../enums/index.js';
import { IPaginationOptions } from './pagination.interface.js';

export interface ITaskFilter extends IPaginationOptions {
  workspaceId: string;
  userId?: string;
  caseId?: string;
  assignedTo?: string;
  status?: TaskStatus | string;
  priority?: Priority | string;
}

export interface ICreateTaskDto {
  title: string;
  description?: string;
  caseId?: string;
  priority?: Priority | string;
  status?: TaskStatus | string;
  dueDate?: string | Date;
  assignedUserIds?: string[];
}

export interface IUpdateTaskDto extends Partial<ICreateTaskDto> {
  completedAt?: string | Date | null;
}

