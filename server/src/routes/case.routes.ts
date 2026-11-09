import { Router } from 'express';
import { caseController } from '../controllers/case.controller.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.middleware.js';
import { PERMISSIONS } from '../constants/permissions.constant.js';

export const caseRouter: Router = Router();

caseRouter.use(authenticateJWT);

caseRouter.get('/', requirePermission(PERMISSIONS.CASE_VIEW), caseController.getCases);
caseRouter.get('/:id', requirePermission(PERMISSIONS.CASE_VIEW), caseController.getCaseById);
caseRouter.post('/', requirePermission(PERMISSIONS.CASE_CREATE), caseController.createCase);
caseRouter.put('/:id', requirePermission(PERMISSIONS.CASE_EDIT), caseController.updateCase);
caseRouter.delete('/:id', requirePermission(PERMISSIONS.CASE_DELETE), caseController.deleteCase);

caseRouter.post('/:id/close', requirePermission(PERMISSIONS.CASE_CLOSE), caseController.closeCase);
caseRouter.post('/:id/reopen', requirePermission(PERMISSIONS.CASE_CLOSE), caseController.reopenCase);
caseRouter.post('/:id/assignments', requirePermission(PERMISSIONS.CASE_ASSIGN), caseController.assignAdvocate);
caseRouter.post('/:id/stage', requirePermission(PERMISSIONS.CASE_EDIT), caseController.changeStage);

caseRouter.post('/:id/parties', requirePermission(PERMISSIONS.CASE_EDIT), caseController.addParty);
caseRouter.delete('/:id/parties/:partyId', requirePermission(PERMISSIONS.CASE_EDIT), caseController.deleteParty);

caseRouter.post('/:id/references', requirePermission(PERMISSIONS.CASE_EDIT), caseController.linkLegalReference);
caseRouter.delete('/:id/references/:referenceId', requirePermission(PERMISSIONS.CASE_EDIT), caseController.unlinkLegalReference);

export default caseRouter;

