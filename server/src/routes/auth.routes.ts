import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { systemController } from '../controllers/system.controller.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.middleware.js';
import { PERMISSIONS } from '../constants/permissions.constant.js';

export const authRouter: Router = Router();

// Public auth routes
authRouter.post('/login', authController.login);

// Protected user profile routes
authRouter.get('/profile', authenticateJWT, authController.getProfile);
authRouter.put('/profile', authenticateJWT, authController.updateProfile);
authRouter.post('/change-password', authenticateJWT, authController.changePassword);

// User Management (Admin)
authRouter.get('/users', authenticateJWT, requirePermission(PERMISSIONS.USER_MANAGE), systemController.getUsers);
authRouter.get('/users/:id', authenticateJWT, requirePermission(PERMISSIONS.USER_MANAGE), systemController.getUserById);
authRouter.post('/users', authenticateJWT, requirePermission(PERMISSIONS.USER_MANAGE), systemController.createUser);
authRouter.put('/users/:id', authenticateJWT, requirePermission(PERMISSIONS.USER_MANAGE), systemController.updateUser);
authRouter.post('/users/:id/reset-password', authenticateJWT, requirePermission(PERMISSIONS.USER_MANAGE), systemController.resetPassword);

// Role Management
authRouter.get('/roles', authenticateJWT, requirePermission(PERMISSIONS.ROLE_MANAGE), systemController.getRoles);
authRouter.post('/roles', authenticateJWT, requirePermission(PERMISSIONS.ROLE_MANAGE), systemController.createRole);
authRouter.put('/roles/:id', authenticateJWT, requirePermission(PERMISSIONS.ROLE_MANAGE), systemController.updateRole);
authRouter.delete('/roles/:id', authenticateJWT, requirePermission(PERMISSIONS.ROLE_MANAGE), systemController.deleteRole);
authRouter.put('/roles/:roleId/permissions', authenticateJWT, requirePermission(PERMISSIONS.ROLE_MANAGE), systemController.updateRolePermissions);

// Permission Management
authRouter.get('/permissions', authenticateJWT, requirePermission(PERMISSIONS.PERMISSION_MANAGE), systemController.getPermissions);

export default authRouter;

