import { IPaginationMeta } from './pagination.interface.js';

export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: IPaginationMeta;
  error?: string;
  errors?: any[];
}

