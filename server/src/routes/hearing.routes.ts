import { Router } from 'express';
import { hearingController } from '../controllers/hearing.controller.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.middleware.js';
import { PERMISSIONS } from '../constants/permissions.constant.js';

export const hearingRouter: Router = Router();

hearingRouter.use(authenticateJWT);

// Courts (Specific routes MUST precede /:id)
hearingRouter.get('/courts', hearingController.getCourts);
hearingRouter.post('/courts', requirePermission(PERMISSIONS.USER_MANAGE), hearingController.createCourt);
hearingRouter.put('/courts/:id', requirePermission(PERMISSIONS.USER_MANAGE), hearingController.updateCourt);
hearingRouter.delete('/courts/:id', requirePermission(PERMISSIONS.USER_MANAGE), hearingController.deleteCourt);

// Judges (Specific routes MUST precede /:id)
hearingRouter.get('/judges', hearingController.getJudges);
hearingRouter.post('/judges', requirePermission(PERMISSIONS.USER_MANAGE), hearingController.createJudge);
hearingRouter.put('/judges/:id', requirePermission(PERMISSIONS.USER_MANAGE), hearingController.updateJudge);
hearingRouter.delete('/judges/:id', requirePermission(PERMISSIONS.USER_MANAGE), hearingController.deleteJudge);

// Cause list
hearingRouter.get('/cause-list', requirePermission(PERMISSIONS.HEARING_VIEW), hearingController.getCauseList);

// Proceedings
hearingRouter.post('/proceedings', requirePermission(PERMISSIONS.HEARING_EDIT), hearingController.createProceeding);
hearingRouter.delete('/proceedings/:id', requirePermission(PERMISSIONS.HEARING_EDIT), hearingController.deleteProceeding);

// Reschedule
hearingRouter.put('/:id/reschedule', requirePermission(PERMISSIONS.HEARING_EDIT), hearingController.rescheduleHearing);

// Hearings CRUD
hearingRouter.get('/', requirePermission(PERMISSIONS.HEARING_VIEW), hearingController.getHearings);
hearingRouter.get('/:id', requirePermission(PERMISSIONS.HEARING_VIEW), hearingController.getHearingById);
hearingRouter.post('/', requirePermission(PERMISSIONS.HEARING_CREATE), hearingController.createHearing);
hearingRouter.put('/:id', requirePermission(PERMISSIONS.HEARING_EDIT), hearingController.updateHearing);
hearingRouter.delete('/:id', requirePermission(PERMISSIONS.HEARING_DELETE), hearingController.deleteHearing);

export default hearingRouter;

