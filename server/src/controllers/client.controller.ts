import { Request, Response } from 'express';
import { clientService, ClientService } from '../services/client.service.js';
import { sendSuccess, sendError, sendPaginated } from '../shared/response.js';
import { HTTP_STATUS } from '../constants/error-codes.constant.js';

export class ClientController {
  public constructor(private readonly service: ClientService = clientService) {}

  public getClients = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const { search, type, status, advocateId, page = '1', limit = '10' } = req.query;

      const result = await this.service.getClients({
        workspaceId,
        search: search ? String(search) : undefined,
        type: type ? String(type) : undefined,
        status: status ? String(status) : undefined,
        advocateId: advocateId ? String(advocateId) : undefined,
        page: parseInt(String(page), 10) || 1,
        limit: parseInt(String(limit), 10) || 10
      });

      sendPaginated(res, result.data, result.meta, 'Clients retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public getClientById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const workspaceId = req.user!.workspaceId;
      const client = await this.service.getClientById(id, workspaceId);

      if (!client) {
        sendError(res, 'Client not found', HTTP_STATUS.NOT_FOUND);
        return;
      }

      sendSuccess(res, client);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public createClient = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const client = await this.service.createClient(workspaceId, req.body, req.user!.id, req.ip);
      sendSuccess(res, client, 'Client registered successfully', HTTP_STATUS.CREATED);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public updateClient = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const workspaceId = req.user!.workspaceId;
      const client = await this.service.updateClient(id, workspaceId, req.body, req.user!.id, req.ip);

      if (!client) {
        sendError(res, 'Client not found', HTTP_STATUS.NOT_FOUND);
        return;
      }

      sendSuccess(res, client, 'Client updated successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public deleteClient = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const workspaceId = req.user!.workspaceId;
      const result = await this.service.deleteClient(id, workspaceId, req.user!.id, req.ip);

      if (result.archived) {
        sendSuccess(res, result.client, 'Client has active matters and was archived safely');
      } else {
        sendSuccess(res, null, 'Client deleted successfully');
      }
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public addContact = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const contact = await this.service.addContact(id, req.body);
      sendSuccess(res, contact, 'Contact added successfully', HTTP_STATUS.CREATED);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public updateContact = async (req: Request, res: Response): Promise<void> => {
    try {
      const { contactId } = req.params;
      const contact = await this.service.updateContact(contactId, req.body);
      sendSuccess(res, contact, 'Contact updated successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public deleteContact = async (req: Request, res: Response): Promise<void> => {
    try {
      const { contactId } = req.params;
      await this.service.deleteContact(contactId);
      sendSuccess(res, null, 'Contact deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public checkConflicts = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const { query } = req.query;
      const results = await this.service.checkConflicts(workspaceId, String(query || ''));
      sendSuccess(res, results);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };
}

export const clientController = new ClientController();

