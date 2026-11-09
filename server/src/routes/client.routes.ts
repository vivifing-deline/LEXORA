import { Router } from 'express';
import { clientController } from '../controllers/client.controller.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.middleware.js';
import { PERMISSIONS } from '../constants/permissions.constant.js';

export const clientRouter: Router = Router();

clientRouter.use(authenticateJWT);

clientRouter.get('/', requirePermission(PERMISSIONS.CLIENT_VIEW), clientController.getClients);
clientRouter.get('/conflicts', requirePermission(PERMISSIONS.CLIENT_VIEW), clientController.checkConflicts);
clientRouter.get('/:id', requirePermission(PERMISSIONS.CLIENT_VIEW), clientController.getClientById);
clientRouter.post('/', requirePermission(PERMISSIONS.CLIENT_CREATE), clientController.createClient);
clientRouter.put('/:id', requirePermission(PERMISSIONS.CLIENT_EDIT), clientController.updateClient);
clientRouter.delete('/:id', requirePermission(PERMISSIONS.CLIENT_DELETE), clientController.deleteClient);

clientRouter.post('/:id/contacts', requirePermission(PERMISSIONS.CLIENT_EDIT), clientController.addContact);
clientRouter.put('/:id/contacts/:contactId', requirePermission(PERMISSIONS.CLIENT_EDIT), clientController.updateContact);
clientRouter.delete('/:id/contacts/:contactId', requirePermission(PERMISSIONS.CLIENT_EDIT), clientController.deleteContact);

export default clientRouter;

