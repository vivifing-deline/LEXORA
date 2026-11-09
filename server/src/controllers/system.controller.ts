import { Request, Response } from 'express';
import { systemService, SystemService } from '../services/system.service.js';
import { sendSuccess, sendError, sendPaginated } from '../shared/response.js';
import { HTTP_STATUS } from '../constants/error-codes.constant.js';

export class SystemController {
  public constructor(private readonly service: SystemService = systemService) {}

  // ------------------------------------------
  // Users
  // ------------------------------------------
  public getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const { search, roleId, isActive, page = '1', limit = '10' } = req.query;

      const result = await this.service.getUsers({
        workspaceId,
        search: search ? String(search) : undefined,
        roleId: roleId ? String(roleId) : undefined,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        page: parseInt(String(page), 10) || 1,
        limit: parseInt(String(limit), 10) || 10
      });

      sendPaginated(res, result.data, result.meta, 'Users retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.service.getUserById(id);
      if (!user) {
        sendError(res, 'User not found', HTTP_STATUS.NOT_FOUND);
        return;
      }
      sendSuccess(res, user);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const adminId = req.user!.id;
      const user = await this.service.createUser(workspaceId, req.body, adminId, req.ip);
      sendSuccess(res, user, 'User registered successfully', HTTP_STATUS.CREATED);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const user = await this.service.updateUser(id, req.body, adminId, req.ip);
      sendSuccess(res, user, 'User updated successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      const adminId = req.user!.id;
      await this.service.resetUserPassword(id, newPassword || 'Demo@123', adminId, req.ip);
      sendSuccess(res, null, 'Password reset successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  // ------------------------------------------
  // Roles
  // ------------------------------------------
  public getRoles = async (_req: Request, res: Response): Promise<void> => {
    try {
      const roles = await this.service.getRoles();
      sendSuccess(res, roles);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public createRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const role = await this.service.createRole(req.body);
      sendSuccess(res, role, 'Role created successfully', HTTP_STATUS.CREATED);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public updateRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const role = await this.service.updateRole(id, req.body);
      sendSuccess(res, role, 'Role updated successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public deleteRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteRole(id);
      sendSuccess(res, null, 'Role deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  // ------------------------------------------
  // Permissions Matrix
  // ------------------------------------------
  public getPermissions = async (_req: Request, res: Response): Promise<void> => {
    try {
      const permissions = await this.service.getPermissions();
      sendSuccess(res, permissions);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public updateRolePermissions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { roleId } = req.params;
      const { permissionIds } = req.body;
      const adminId = req.user!.id;
      await this.service.updateRolePermissions(roleId, permissionIds, adminId, req.ip);
      sendSuccess(res, null, 'Role permissions updated successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  // ------------------------------------------
  // Audit Logs
  // ------------------------------------------
  public getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const { module, action, userId, page = '1', limit = '20' } = req.query;
      const logs = await this.service.getAuditLogs(workspaceId, {
        module: module ? String(module) : undefined,
        action: action ? String(action) : undefined,
        userId: userId ? String(userId) : undefined,
        page: parseInt(String(page), 10) || 1,
        limit: parseInt(String(limit), 10) || 20
      });
      sendPaginated(res, logs.data, logs.meta, 'Audit logs retrieved');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  // ------------------------------------------
  // Settings
  // ------------------------------------------
  public getWorkspaceSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const settings = await this.service.getWorkspaceSettings(workspaceId);
      sendSuccess(res, settings);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public updateWorkspaceSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const adminId = req.user!.id;
      const updated = await this.service.updateWorkspaceSettings(workspaceId, req.body, adminId, req.ip);
      sendSuccess(res, updated, 'Firm settings saved successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  // ------------------------------------------
  // Environment Info, Demo Reset & Backups
  // ------------------------------------------
  public getEnvironmentInfo = async (_req: Request, res: Response): Promise<void> => {
    try {
      const info = await this.service.getEnvironmentInfo();
      sendSuccess(res, info);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public demoReset = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.roles.includes('Firm Admin')) {
        sendError(res, 'Only Firm Administrators can initiate a demo data reset.', HTTP_STATUS.FORBIDDEN);
        return;
      }
      await this.service.demoReset(req.user.id, req.ip);
      sendSuccess(res, null, 'Demo dataset successfully restored to original presentation state.');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public backupDatabase = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.roles.includes('Firm Admin')) {
        sendError(res, 'Only Firm Administrators can create database backups.', HTTP_STATUS.FORBIDDEN);
        return;
      }
      const backup = await this.service.backupDatabase(req.user.workspaceId, req.user.id, req.ip);
      sendSuccess(res, backup, 'Database backup created successfully', HTTP_STATUS.CREATED);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public restoreDatabase = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.roles.includes('Firm Admin')) {
        sendError(res, 'Only Firm Administrators can restore database backups.', HTTP_STATUS.FORBIDDEN);
        return;
      }
      const { fileName } = req.body;
      if (!fileName) {
        sendError(res, 'Backup file name is required', HTTP_STATUS.BAD_REQUEST);
        return;
      }
      await this.service.restoreDatabase(fileName);
      sendSuccess(res, null, `Database restored successfully from ${fileName}`);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  // ------------------------------------------
  // Reports & CSV Export
  // ------------------------------------------
  public getReports = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const { type = 'cases' } = req.query;
      const reports = await this.service.getReports(workspaceId, String(type));
      sendSuccess(res, reports);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public exportReportCsv = async (req: Request, res: Response): Promise<void> => {
    try {
      const workspaceId = req.user!.workspaceId;
      const { module = 'cases' } = req.query;

      if (module === 'cases') {
        const cases = await this.service.getReports(workspaceId, 'cases');
        const headers = ['Internal Ref', 'Court Case No', 'Title', 'Client', 'Practice Area', 'Court', 'Stage', 'Status', 'Filing Date'];
        const rows = cases.map((c: any) => [
          `"${c.internalReference}"`,
          `"${c.courtCaseNumber || ''}"`,
          `"${(c.title || '').replace(/"/g, '""')}"`,
          `"${(c.client?.name || '').replace(/"/g, '""')}"`,
          `"${c.practiceArea?.name || ''}"`,
          `"${c.court?.name || ''}"`,
          `"${c.currentStage}"`,
          `"${c.status}"`,
          `"${c.filingDate ? new Date(c.filingDate).toISOString().split('T')[0] : ''}"`
        ]);
        const csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="lexora-cases-report.csv"');
        res.status(200).send(csvContent);
        return;
      }

      sendError(res, 'Unsupported CSV module', HTTP_STATUS.BAD_REQUEST);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  // ------------------------------------------
  // Notifications
  // ------------------------------------------
  public getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const notifications = await this.service.getNotifications(userId);
      sendSuccess(res, notifications);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public markNotificationRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      await this.service.markNotificationRead(userId, id);
      sendSuccess(res, null, id === 'all' ? 'All notifications marked as read' : 'Notification marked as read');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  // ------------------------------------------
  // Departments
  // ------------------------------------------
  public getDepartments = async (_req: Request, res: Response): Promise<void> => {
    try {
      const depts = await this.service.getDepartments();
      sendSuccess(res, depts);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public createDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description } = req.body;
      if (!name) {
        sendError(res, 'Department name is required', HTTP_STATUS.BAD_REQUEST);
        return;
      }
      const dept = await this.service.createDepartment(name, description);
      sendSuccess(res, dept, 'Department created successfully', HTTP_STATUS.CREATED);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public updateDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body;
      const dept = await this.service.updateDepartment(id, name, description, isActive);
      sendSuccess(res, dept, 'Department updated successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public deleteDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteDepartment(id);
      sendSuccess(res, null, 'Department deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  // ------------------------------------------
  // Practice Areas
  // ------------------------------------------
  public getPracticeAreas = async (_req: Request, res: Response): Promise<void> => {
    try {
      const areas = await this.service.getPracticeAreas();
      sendSuccess(res, areas);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public createPracticeArea = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, code, description, icon } = req.body;
      if (!name || !code) {
        sendError(res, 'Practice area name and code are required', HTTP_STATUS.BAD_REQUEST);
        return;
      }
      const area = await this.service.createPracticeArea({ name, code, description, icon });
      sendSuccess(res, area, 'Practice area created successfully', HTTP_STATUS.CREATED);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public updatePracticeArea = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const area = await this.service.updatePracticeArea(id, req.body);
      sendSuccess(res, area, 'Practice area updated successfully');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public deletePracticeArea = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.service.deletePracticeArea(id);
      sendSuccess(
        res,
        null,
        deleted ? 'Practice area deleted successfully' : 'Practice area has active cases; marked inactive rather than deleted.'
      );
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  // ------------------------------------------
  // Calendar Events
  // ------------------------------------------
  public getCalendarEvents = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const events = await this.service.getCalendarEvents(
        startDate ? String(startDate) : undefined,
        endDate ? String(endDate) : undefined
      );
      sendSuccess(res, events);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public createCalendarEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, startTime } = req.body;
      if (!title || !startTime) {
        sendError(res, 'Title and start time are required', HTTP_STATUS.BAD_REQUEST);
        return;
      }
      const event = await this.service.createCalendarEvent(req.body);
      sendSuccess(res, event, 'Calendar event scheduled', HTTP_STATUS.CREATED);
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public updateCalendarEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const event = await this.service.updateCalendarEvent(id, req.body);
      sendSuccess(res, event, 'Calendar event updated');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };

  public deleteCalendarEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteCalendarEvent(id);
      sendSuccess(res, null, 'Calendar event deleted');
    } catch (error: any) {
      sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  };
}

export const systemController = new SystemController();
