import { Request, Response } from 'express';
import { hearingService, HearingService } from '../services/hearing.service.js';
import { sendSuccess, sendError, sendPaginated } from '../shared/response.js';
import { HTTP_STATUS } from '../constants/error-codes.constant.js';

export class HearingController {
  public constructor(private readonly service: HearingService = hearingService) {}

  public getHearings = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const { caseId, courtId, status, startDate, endDate, page = '1', limit = '10' } = req.query;

      const result = await this.service.getHearings({
        workspaceId,
        caseId: caseId ? String(caseId) : undefined,
        courtId: courtId ? String(courtId) : undefined,
        status: status ? String(status) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        page: parseInt(String(page), 10) || 1,
        limit: parseInt(String(limit), 10) || 10
      });

      sendPaginated(res, result.data, result.meta, 'Hearings retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public getHearingById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const hearing = await this.service.getHearingById(id);
      if (!hearing) {
        sendError(res, 'Hearing not found', HTTP_STATUS.NOT_FOUND);
        return;
      }
      sendSuccess(res, hearing);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public createHearing = async (req: Request, res: Response): Promise<void> => {
    try {
      const hearing = await this.service.createHearing(req.body);
      sendSuccess(res, hearing, 'Hearing scheduled successfully', HTTP_STATUS.CREATED);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public updateHearing = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updated = await this.service.updateHearing(id, req.body);
      sendSuccess(res, updated, 'Hearing updated successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public deleteHearing = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteHearing(id);
      sendSuccess(res, null, 'Hearing deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public getCauseList = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const { date } = req.query;
      const result = await this.service.getCauseList(workspaceId, date ? String(date) : undefined);
      sendSuccess(res, result);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public rescheduleHearing = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.service.rescheduleHearing(id, req.body);
      sendSuccess(res, result, 'Hearing rescheduled successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  // Courts
  public getCourts = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user?.workspaceId;
      const courts = await this.service.getCourts(workspaceId);
      sendSuccess(res, courts);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public createCourt = async (req: Request, res: Response): Promise<void> => {
    try {
      const court = await this.service.createCourt(req.body);
      sendSuccess(res, court, 'Court created successfully', HTTP_STATUS.CREATED);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public updateCourt = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const court = await this.service.updateCourt(id, req.body);
      sendSuccess(res, court, 'Court updated successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public deleteCourt = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteCourt(id);
      sendSuccess(res, null, 'Court deleted or deactivated');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  // Judges
  public getJudges = async (req: Request, res: Response): Promise<void> => {
    try {
      const { courtId } = req.query;
      const judges = await this.service.getJudges(courtId ? String(courtId) : undefined);
      sendSuccess(res, judges);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public createJudge = async (req: Request, res: Response): Promise<void> => {
    try {
      const judge = await this.service.createJudge(req.body);
      sendSuccess(res, judge, 'Judge created successfully', HTTP_STATUS.CREATED);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public updateJudge = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const judge = await this.service.updateJudge(id, req.body);
      sendSuccess(res, judge, 'Judge updated successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public deleteJudge = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteJudge(id);
      sendSuccess(res, null, 'Judge deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  // Proceedings
  public createProceeding = async (req: Request, res: Response): Promise<void> => {
    try {
      const proceeding = await this.service.createProceeding({ ...req.body, recordedBy: req.user!.email });
      sendSuccess(res, proceeding, 'Proceeding recorded successfully', HTTP_STATUS.CREATED);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public deleteProceeding = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteProceeding(id);
      sendSuccess(res, null, 'Proceeding deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };
}

export const hearingController = new HearingController();

