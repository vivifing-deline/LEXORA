import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { config } from '../config/env.js';
import { resolveEffectivePermissions } from '../middleware/auth.middleware.js';
import { ILoginRequest, ILoginResponse } from '../interfaces/auth.interface.js';
import { AuditAction } from '../enums/index.js';

export class AuthService {
  public async login(credentials: ILoginRequest, userIp?: string): Promise<ILoginResponse> {
    const { email, password } = credentials;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        workspace: true,
        department: true,
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

    if (!user) throw new Error('Invalid email or password');
    if (!user.isActive) throw new Error('Account is deactivated. Please contact your Firm Administrator.');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new Error('Invalid email or password');

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: user.workspaceId,
        userId: user.id,
        action: AuditAction.LOGIN,
        module: 'Users',
        entityId: user.id,
        entityName: user.email,
        ipAddress: userIp
      }
    });

    const roles = user.userRoles.map(ur => ur.role.name);
    const rolePermissions = user.userRoles.flatMap(ur =>
      ur.role.rolePermissions.map(rp => rp.permission.code)
    );
    const permissions = resolveEffectivePermissions(rolePermissions, user.userPermissions);

    const token = jwt.sign(
      { userId: user.id, email: user.email, workspaceId: user.workspaceId },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        designation: user.designation,
        avatarUrl: user.avatarUrl,
        workspaceId: user.workspaceId,
        workspaceName: user.workspace.name,
        roles,
        permissions
      }
    };
  }

  public async getProfile(userId: string): Promise<any> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        workspace: true,
        department: true,
        userRoles: { include: { role: true } },
        userPermissions: { include: { permission: true } }
      }
    });
  }

  public async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string; designation?: string; themePreference?: string }): Promise<any> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName ? data.firstName.trim() : undefined,
        lastName: data.lastName ? data.lastName.trim() : undefined,
        phone: data.phone !== undefined ? data.phone : undefined,
        designation: data.designation !== undefined ? data.designation : undefined,
        themePreference: data.themePreference || undefined
      }
    });
  }

  public async changePassword(userId: string, currentPass: string, newPass: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(currentPass, user.passwordHash);
    if (!isMatch) throw new Error('Current password is incorrect');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPass, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });
  }
}

export const authService = new AuthService();

