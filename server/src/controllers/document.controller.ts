import { Request, Response } from 'express';
import fs from 'fs';
import { documentService, DocumentService } from '../services/document.service.js';
import { sendSuccess, sendError, sendPaginated } from '../shared/response.js';
import { HTTP_STATUS } from '../constants/error-codes.constant.js';

export class DocumentController {
  public constructor(private readonly service: DocumentService = documentService) {}

  public getDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const { caseId, category, search, page = '1', limit = '10' } = req.query;

      const result = await this.service.getDocuments({
        workspaceId,
        caseId: caseId ? String(caseId) : undefined,
        category: category ? String(category) : undefined,
        search: search ? String(search) : undefined,
        page: parseInt(String(page), 10) || 1,
        limit: parseInt(String(limit), 10) || 10
      });

      sendPaginated(res, result.data, result.meta, 'Documents retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public getDocumentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const workspaceId = req.user!.workspaceId;
      const doc = await this.service.getDocumentById(id, workspaceId);

      if (!doc) {
        sendError(res, 'Document not found', HTTP_STATUS.NOT_FOUND);
        return;
      }

      sendSuccess(res, doc);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public uploadDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const userId = req.user!.id;
      const userEmail = req.user!.email;
      const file = req.file;

      if (!file) {
        sendError(res, 'No file uploaded', HTTP_STATUS.BAD_REQUEST);
        return;
      }

      const doc = await this.service.uploadDocument(workspaceId, userId, userEmail, file, req.body, req.ip);
      sendSuccess(res, doc, 'Document uploaded successfully', HTTP_STATUS.CREATED);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public updateDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updated = await this.service.updateDocument(id, req.body);
      sendSuccess(res, updated, 'Document updated successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public deleteDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      await this.service.deleteDocument(id, userId, req.ip);
      sendSuccess(res, null, 'Document deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public downloadDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const workspaceId = req.user!.workspaceId;
      const doc = await this.service.getDocumentById(id, workspaceId);

      if (!doc) {
        sendError(res, 'Document not found', HTTP_STATUS.NOT_FOUND);
        return;
      }

      if (!fs.existsSync(doc.filePath)) {
        sendError(res, 'File does not exist on disk', HTTP_STATUS.NOT_FOUND);
        return;
      }

      res.download(doc.filePath, doc.originalName);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  // Legal References
  public getLegalReferences = async (req: Request, res: Response): Promise<void> => {
    try {
      const { search, category } = req.query;
      const refs = await this.service.getLegalReferences({
        search: search ? String(search) : undefined,
        category: category ? String(category) : undefined
      });
      sendSuccess(res, refs);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public createLegalReference = async (req: Request, res: Response): Promise<void> => {
    try {
      const ref = await this.service.createLegalReference(req.body);
      sendSuccess(res, ref, 'Legal reference created', HTTP_STATUS.CREATED);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public updateLegalReference = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const ref = await this.service.updateLegalReference(id, req.body);
      sendSuccess(res, ref, 'Legal reference updated');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public deleteLegalReference = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteLegalReference(id);
      sendSuccess(res, null, 'Legal reference deleted');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };
}

export const documentController = new DocumentController();

