import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import prisma from '../config/db.js';
import { sendError } from '../shared/response.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  workspaceId: string;
  roles: string[];
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Resolves effective permissions according to strict precedence:
 * Effective = (Role Permissions) UNION (Explicit User Grants) MINUS (Explicit User Denials)
 */
export const resolveEffectivePermissions = (
  rolePermissions: string[],
  userPermissions: Array<{ isGranted: boolean; permission: { code: string } }>
): string[] => {
  const permSet = new Set<string>(rolePermissions);

  // 1. Apply explicit user grants
  userPermissions
    .filter(up => up.isGranted)
    .forEach(up => permSet.add(up.permission.code));

  // 2. Apply explicit user denials (subtractive override)
  userPermissions
    .filter(up => !up.isGranted)
    .forEach(up => permSet.delete(up.permission.code));

  return Array.from(permSet);
};

export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication token required', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true }
                }
              }
            }
          }
        },
        userPermissions: {
          include: { permission: true }
        }
      }
    });

    if (!user || !user.isActive) {
      sendError(res, 'User account is inactive or not found', 403);
      return;
    }

    const roles = user.userRoles.map(ur => ur.role.name);
    const rolePermissions = user.userRoles.flatMap(ur =>
      ur.role.rolePermissions.map(rp => rp.permission.code)
    );

    const effectivePermissions = resolveEffectivePermissions(rolePermissions, user.userPermissions);

    req.user = {
      id: user.id,
      email: user.email,
      workspaceId: user.workspaceId,
      roles,
      permissions: effectivePermissions
    };

    next();
  } catch (error) {
    sendError(res, 'Invalid or expired token', 401);
  }
};

export const requirePermission = (permissionCode: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    // Firm Admin has unrestricted administrative access
    if (req.user.roles.includes('Firm Admin')) {
      next();
      return;
    }

    if (!req.user.permissions.includes(permissionCode)) {
      sendError(res, `Forbidden: Missing permission ${permissionCode}`, 403);
      return;
    }

    next();
  };
};

export const requireRole = (roleName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    if (req.user.roles.includes('Firm Admin') || req.user.roles.includes(roleName)) {
      next();
      return;
    }

    sendError(res, `Forbidden: Requires role ${roleName}`, 403);
  };
};

/**
 * Validates that an operation will not leave the workspace with 0 active Firm Admins.
 */
export const checkAdminLockout = async (targetUserId: string, workspaceId: string): Promise<boolean> => {
  const activeAdmins = await prisma.user.findMany({
    where: {
      workspaceId,
      isActive: true,
      userRoles: {
        some: {
          role: { name: 'Firm Admin' }
        }
      }
    }
  });

  // If there is only 1 active admin and it's the target user, action would cause lockout
  return activeAdmins.length === 1 && activeAdmins[0].id === targetUserId;
};
