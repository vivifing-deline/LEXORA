import { Request, Response } from 'express';
import { caseService, CaseService } from '../services/case.service.js';
import { sendSuccess, sendError, sendPaginated } from '../shared/response.js';
import { HTTP_STATUS } from '../constants/error-codes.constant.js';

export class CaseController {
  public constructor(private readonly service: CaseService = caseService) {}

  public getCases = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;
      const isClient = req.user!.roles.includes('Client');
      const {
        search,
        practiceAreaId,
        status,
        stage,
        priority,
        courtId,
        advocateId,
        page = '1',
        limit = '10'
      } = req.query;

      const result = await this.service.getCases({
        workspaceId,
        userId,
        isClient,
        search: search ? String(search) : undefined,
        practiceAreaId: practiceAreaId ? String(practiceAreaId) : undefined,
        status: status ? String(status) : undefined,
        stage: stage ? String(stage) : undefined,
        priority: priority ? String(priority) : undefined,
        courtId: courtId ? String(courtId) : undefined,
        advocateId: advocateId ? String(advocateId) : undefined,
        page: parseInt(String(page), 10) || 1,
        limit: parseInt(String(limit), 10) || 10
      });

      sendPaginated(res, result.data, result.meta, 'Cases retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public getCaseById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const workspaceId = req.user!.workspaceId;
      const caseRecord = await this.service.getCaseById(id, workspaceId);

      if (!caseRecord) {
        sendError(res, 'Case not found', HTTP_STATUS.NOT_FOUND);
        return;
      }

      sendSuccess(res, caseRecord);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public createCase = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const newCase = await this.service.createCase(workspaceId, req.body, req.user!.email, req.ip);
      sendSuccess(res, newCase, 'Case registered successfully', HTTP_STATUS.CREATED);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public updateCase = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const workspaceId = req.user!.workspaceId;
      const updated = await this.service.updateCase(id, workspaceId, req.body, req.user!.email);
      sendSuccess(res, updated, 'Case updated successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public changeStage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { stage, remarks } = req.body;
      const updated = await this.service.changeStage(id, stage, remarks, req.user!.email);
      sendSuccess(res, updated, `Case stage updated to ${stage}`);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public closeCase = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { closureReason } = req.body;
      const updated = await this.service.closeCase(id, closureReason, req.user!.email);
      sendSuccess(res, updated, 'Case closed successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public reopenCase = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updated = await this.service.reopenCase(id, req.user!.email);
      sendSuccess(res, updated, 'Case reopened successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public assignAdvocate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { userId, roleInCase } = req.body;
      await this.service.assignAdvocate(id, userId, roleInCase, req.user!.email);
      sendSuccess(res, null, 'Advocate assignment updated');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public addParty = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const party = await this.service.addParty(id, req.body);
      sendSuccess(res, party, 'Party added to case', HTTP_STATUS.CREATED);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public deleteParty = async (req: Request, res: Response): Promise<void> => {
    try {
      const { partyId } = req.params;
      await this.service.deleteParty(partyId);
      sendSuccess(res, null, 'Party removed from case');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public linkLegalReference = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { legalReferenceId, notes } = req.body;
      const link = await this.service.linkLegalReference(id, legalReferenceId, notes);
      sendSuccess(res, link, 'Legal reference linked');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public unlinkLegalReference = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, referenceId } = req.params;
      await this.service.unlinkLegalReference(id, referenceId);
      sendSuccess(res, null, 'Legal reference unlinked');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public deleteCase = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const workspaceId = req.user!.workspaceId;
      await this.service.deleteCase(id, workspaceId, req.ip);
      sendSuccess(res, null, 'Case deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };
}

export const caseController = new CaseController();

