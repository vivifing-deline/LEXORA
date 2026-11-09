import { Response } from 'express';
import { IApiResponse } from '../interfaces/response.interface.js';
import { IPaginationMeta } from '../interfaces/pagination.interface.js';
import { HTTP_STATUS } from '../constants/error-codes.constant.js';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = HTTP_STATUS.OK,
  meta?: IPaginationMeta
): Response => {
  const body: IApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta })
  };
  return res.status(statusCode).json(body);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  meta: IPaginationMeta,
  message?: string,
  statusCode: number = HTTP_STATUS.OK
): Response => {
  const body: IApiResponse<T[]> = {
    success: true,
    data,
    meta,
    ...(message && { message })
  };
  return res.status(statusCode).json(body);
};

export const sendError = (
  res: Response,
  message: string = 'An error occurred',
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errors?: any
): Response => {
  const body: IApiResponse = {
    success: false,
    message,
    ...(errors && { errors })
  };
  return res.status(statusCode).json(body);
};

