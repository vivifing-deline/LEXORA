import { Router } from 'express';
import { systemController } from '../controllers/system.controller.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.middleware.js';
import { PERMISSIONS } from '../constants/permissions.constant.js';

export const systemRouter: Router = Router();

systemRouter.use(authenticateJWT);

// Environment & Backup / Demo Reset
systemRouter.get('/info', systemController.getEnvironmentInfo);
systemRouter.post('/demo-reset', systemController.demoReset);
systemRouter.post('/backup', systemController.backupDatabase);
systemRouter.post('/restore', systemController.restoreDatabase);

// Reports
systemRouter.get('/reports', systemController.getReports);
systemRouter.get('/reports/export', systemController.exportReportCsv);

// Notifications
systemRouter.get('/notifications', systemController.getNotifications);
systemRouter.put('/notifications/:id/read', systemController.markNotificationRead);

// Audit logs
systemRouter.get('/audit', requirePermission(PERMISSIONS.AUDIT_VIEW), systemController.getAuditLogs);
systemRouter.get('/audit-logs', requirePermission(PERMISSIONS.AUDIT_VIEW), systemController.getAuditLogs);

// Settings
systemRouter.get('/settings', systemController.getWorkspaceSettings);
systemRouter.put('/settings', systemController.updateWorkspaceSettings);

// Departments
systemRouter.get('/departments', systemController.getDepartments);
systemRouter.post('/departments', systemController.createDepartment);
systemRouter.put('/departments/:id', systemController.updateDepartment);
systemRouter.delete('/departments/:id', systemController.deleteDepartment);

// Practice Areas
systemRouter.get('/practice-areas', systemController.getPracticeAreas);
systemRouter.post('/practice-areas', systemController.createPracticeArea);
systemRouter.put('/practice-areas/:id', systemController.updatePracticeArea);
systemRouter.delete('/practice-areas/:id', systemController.deletePracticeArea);

// Calendar Events
systemRouter.get('/calendar/events', systemController.getCalendarEvents);
systemRouter.post('/calendar/events', systemController.createCalendarEvent);
systemRouter.put('/calendar/events/:id', systemController.updateCalendarEvent);
systemRouter.delete('/calendar/events/:id', systemController.deleteCalendarEvent);

export default systemRouter;
