import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import prisma from '../config/db.js';
import { config } from '../config/env.js';
import { userRepository, UserRepository } from '../repositories/user.repository.js';
import { roleRepository } from '../repositories/role.repository.js';
import { permissionRepository } from '../repositories/permission.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { departmentRepository } from '../repositories/department.repository.js';
import { practiceAreaRepository } from '../repositories/practice-area.repository.js';
import { calendarEventRepository } from '../repositories/calendar-event.repository.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { IUserFilter, ICreateUserDto, IUpdateUserDto, ICreateRoleDto, IUpdateRoleDto } from '../interfaces/system.interface.js';
import { IPaginatedResult } from '../interfaces/pagination.interface.js';
import { AuditAction } from '../enums/index.js';

const execAsync = promisify(exec);

export class SystemService {
  public constructor(
    private readonly userRepo: UserRepository = userRepository
  ) {}

  // ------------------------------------------
  // 1. Users CRUD & Auth Management
  // ------------------------------------------
  public async getUsers(filter: IUserFilter): Promise<IPaginatedResult<any>> {
    return this.userRepo.getFilteredUsers(filter);
  }

  public async getUserById(id: string): Promise<any> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        department: true,
        userRoles: { include: { role: true } },
        userPermissions: { include: { permission: true } }
      }
    });
  }

  public async createUser(workspaceId: string, data: ICreateUserDto, adminId: string, adminIp?: string): Promise<any> {
    const { email, password, firstName, lastName, designation, phone, roleIds = [], departmentId } = data;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) throw new Error(`User with email ${email} already exists`);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'Demo@123', salt);

    const newUser = await prisma.user.create({
      data: {
        workspaceId,
        email: email.toLowerCase().trim(),
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        designation: designation || null,
        phone: phone || null,
        departmentId: departmentId || null,
        isActive: true,
        userRoles: roleIds.length > 0 ? {
          create: roleIds.map((rId: string) => ({ roleId: rId }))
        } : undefined
      },
      include: {
        department: true,
        userRoles: { include: { role: true } }
      }
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: adminId,
        action: AuditAction.CREATE,
        module: 'Users',
        entityId: newUser.id,
        entityName: `${newUser.firstName} ${newUser.lastName}`,
        newValues: JSON.stringify({ email: newUser.email, roles: roleIds }),
        ipAddress: adminIp
      }
    });

    return newUser;
  }

  public async updateUser(id: string, updates: IUpdateUserDto, adminId: string, adminIp?: string): Promise<any> {
    const { firstName, lastName, designation, phone, departmentId, isActive, roleIds } = updates;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        firstName: firstName ? firstName.trim() : undefined,
        lastName: lastName ? lastName.trim() : undefined,
        designation: designation !== undefined ? designation : undefined,
        phone: phone !== undefined ? phone : undefined,
        departmentId: departmentId !== undefined ? departmentId : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined
      },
      include: {
        department: true,
        userRoles: { include: { role: true } }
      }
    });

    if (roleIds && Array.isArray(roleIds)) {
      await prisma.userRole.deleteMany({ where: { userId: id } });
      for (const rId of roleIds) {
        await prisma.userRole.create({
          data: { userId: id, roleId: rId }
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        workspaceId: updated.workspaceId,
        userId: adminId,
        action: AuditAction.UPDATE,
        module: 'Users',
        entityId: updated.id,
        entityName: `${updated.firstName} ${updated.lastName}`,
        ipAddress: adminIp
      }
    });

    return updated;
  }

  public async resetUserPassword(id: string, newPassword: string, adminId: string, adminIp?: string): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const user = await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: user.workspaceId,
        userId: adminId,
        action: AuditAction.UPDATE,
        module: 'Users',
        entityId: user.id,
        entityName: `Password Reset: ${user.email}`,
        ipAddress: adminIp
      }
    });
  }

  // ------------------------------------------
  // 2. Roles Management
  // ------------------------------------------
  public async getRoles(): Promise<any[]> {
    return roleRepository.findMany({}, { orderBy: { name: 'asc' } }, {
      rolePermissions: { include: { permission: true } },
      _count: { select: { userRoles: true } }
    });
  }

  public async createRole(data: ICreateRoleDto): Promise<any> {
    const { name, displayName, description, permissionIds = [] } = data;
    return prisma.role.create({
      data: {
        name: name.trim(),
        displayName: displayName.trim(),
        description: description || null,
        isSystem: false,
        rolePermissions: permissionIds.length > 0 ? {
          create: permissionIds.map((pId: string) => ({ permissionId: pId }))
        } : undefined
      },
      include: {
        rolePermissions: { include: { permission: true } }
      }
    });
  }

  public async updateRole(id: string, data: IUpdateRoleDto): Promise<any> {
    const { displayName, description, permissionIds } = data;
    const updated = await prisma.role.update({
      where: { id },
      data: {
        displayName: displayName ? displayName.trim() : undefined,
        description: description !== undefined ? description : undefined
      }
    });

    if (permissionIds && Array.isArray(permissionIds)) {
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });
      for (const pId of permissionIds) {
        await prisma.rolePermission.create({
          data: { roleId: id, permissionId: pId }
        });
      }
    }

    return updated;
  }

  public async deleteRole(id: string): Promise<void> {
    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { userRoles: true } } }
    });

    if (!role) throw new Error('Role not found');
    if (role.isSystem) throw new Error('System roles cannot be deleted');
    if (role._count.userRoles > 0) throw new Error('Cannot delete role with assigned users. Reassign users first.');

    await prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await prisma.role.delete({ where: { id } });
  }

  // ------------------------------------------
  // 3. Permissions Matrix
  // ------------------------------------------
  public async getPermissions(): Promise<any[]> {
    return permissionRepository.findMany({}, { orderBy: [{ module: 'asc' }, { action: 'asc' }] }, {
      rolePermissions: { include: { role: true } }
    });
  }

  public async updateRolePermissions(roleId: string, permissionIds: string[], adminId: string, adminIp?: string): Promise<void> {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new Error('Role not found');

    await prisma.rolePermission.deleteMany({ where: { roleId } });
    for (const pId of permissionIds) {
      await prisma.rolePermission.create({
        data: { roleId, permissionId: pId }
      });
    }

    await prisma.auditLog.create({
      data: {
        workspaceId: (await prisma.workspace.findFirst())?.id || '',
        userId: adminId,
        action: AuditAction.PERMISSION_CHANGE,
        module: 'Permissions',
        entityId: roleId,
        entityName: `Role Permission Matrix: ${role.name}`,
        newValues: JSON.stringify({ permissionsCount: permissionIds.length }),
        ipAddress: adminIp
      }
    });
  }

  // ------------------------------------------
  // 4. Audit Logs
  // ------------------------------------------
  public async getAuditLogs(workspaceId: string, filter: any): Promise<any> {
    return auditRepository.getFilteredLogs(workspaceId, filter);
  }

  // ------------------------------------------
  // 5. Workspace Settings
  // ------------------------------------------
  public async getWorkspaceSettings(workspaceId: string): Promise<any> {
    const [workspace, settings, practiceAreas, courts, departments] = await Promise.all([
      prisma.workspace.findUnique({ where: { id: workspaceId } }),
      prisma.workspaceSetting.findMany({ where: { workspaceId } }),
      prisma.practiceArea.findMany({ orderBy: { name: 'asc' } }),
      prisma.court.findMany({ where: { workspaceId }, include: { judges: true } }),
      prisma.department.findMany({ orderBy: { name: 'asc' } })
    ]);
    return { workspace, settings, practiceAreas, courts, departments };
  }

  public async updateWorkspaceSettings(workspaceId: string, data: any, adminId: string, adminIp?: string): Promise<any> {
    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: adminId,
        action: AuditAction.UPDATE,
        module: 'Settings',
        entityId: workspace.id,
        entityName: 'Firm Settings Updated',
        ipAddress: adminIp
      }
    });

    return workspace;
  }

  // ------------------------------------------
  // 6. Environment Info & Demo Reset & Backups
  // ------------------------------------------
  public async getEnvironmentInfo(): Promise<any> {
    const backupDir = path.resolve(path.dirname(config.databasePath), 'backups');
    let lastBackupDate: string | null = null;

    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.db'))
        .map(f => ({
          name: f,
          time: fs.statSync(path.join(backupDir, f)).mtime
        }))
        .sort((a, b) => b.time.getTime() - a.time.getTime());

      if (files.length > 0) {
        lastBackupDate = files[0].time.toISOString();
      }
    }

    return {
      appMode: config.appMode,
      demoMode: config.demoMode,
      demoResetEnabled: config.demoResetEnabled,
      nodeEnv: config.nodeEnv,
      databaseType: 'SQLite',
      databaseConnected: true,
      databaseName: path.basename(config.databasePath),
      version: config.version,
      lastBackupDate
    };
  }

  public async demoReset(adminId: string, adminIp?: string): Promise<void> {
    if (!config.demoResetEnabled || config.appMode !== 'demo' || config.isProd) {
      throw new Error('Demo reset is strictly disabled in Normal App Mode and Production environments.');
    }

    const serverRoot = path.resolve(path.dirname(config.databasePath), '..');

    await execAsync(`DATABASE_URL="${config.databaseUrl}" npx tsx prisma/seed.ts`, {
      cwd: serverRoot,
      env: { ...process.env, DATABASE_URL: config.databaseUrl }
    });

    const currentWorkspace = await prisma.workspace.findFirst();
    if (currentWorkspace) {
      await prisma.auditLog.create({
        data: {
          workspaceId: currentWorkspace.id,
          userId: adminId,
          action: AuditAction.UPDATE,
          module: 'System',
          entityId: 'demo-reset',
          entityName: 'Demo Data Environment Reset',
          ipAddress: adminIp
        }
      });
    }
  }

  public async backupDatabase(workspaceId: string, userId: string, ip?: string): Promise<any> {
    const backupDir = path.resolve(path.dirname(config.databasePath), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `lexora-backup-${timestamp}.db`;
    const backupFilePath = path.join(backupDir, backupFileName);

    fs.copyFileSync(config.databasePath, backupFilePath);
    const stats = fs.statSync(backupFilePath);

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId,
        action: AuditAction.CREATE,
        module: 'System',
        entityId: backupFileName,
        entityName: `Database Backup: ${backupFileName}`,
        ipAddress: ip
      }
    });

    return {
      fileName: backupFileName,
      sizeBytes: stats.size,
      createdAt: new Date().toISOString()
    };
  }

  public async restoreDatabase(fileName: string): Promise<void> {
    const backupDir = path.resolve(path.dirname(config.databasePath), 'backups');
    const backupFilePath = path.join(backupDir, fileName);

    if (!fs.existsSync(backupFilePath)) {
      throw new Error('Backup file does not exist');
    }

    fs.copyFileSync(backupFilePath, config.databasePath);
  }

  // ------------------------------------------
  // 7. Reports & CSV Export
  // ------------------------------------------
  public async getReports(workspaceId: string, type: string = 'cases'): Promise<any> {
    if (type === 'finance') {
      const invoices = await prisma.invoice.findMany({
        where: { workspaceId },
        include: { client: true }
      });
      const expenses = await prisma.expense.findMany({
        where: { workspaceId }
      });

      const totalBilled = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
      const totalCollected = invoices.reduce((sum, i) => sum + i.amountPaid, 0);
      const outstanding = invoices.reduce((sum, i) => sum + i.balanceDue, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      return {
        summary: { totalBilled, totalCollected, outstanding, totalExpenses, netIncome: totalCollected - totalExpenses },
        invoices,
        expenses
      };
    }

    if (type === 'workload') {
      const users = await prisma.user.findMany({
        where: { workspaceId, isActive: true },
        include: {
          caseAssignments: { include: { case: true } },
          taskAssignments: { include: { task: true } },
          assignedHearings: { where: { hearingDate: { gte: new Date() } } }
        }
      });

      return users.map(u => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        designation: u.designation,
        activeCases: u.caseAssignments.filter(ca => ca.case.status === 'active').length,
        pendingTasks: u.taskAssignments.filter(ta => ta.task.status !== 'completed').length,
        upcomingHearings: u.assignedHearings.length
      }));
    }

    return prisma.case.findMany({
      where: { workspaceId },
      include: {
        client: true,
        practiceArea: true,
        court: true,
        assignments: { include: { user: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // ------------------------------------------
  // 8. Notifications
  // ------------------------------------------
  public async getNotifications(userId: string): Promise<any[]> {
    return notificationRepository.findMany(
      { userId },
      { orderBy: { createdAt: 'desc' }, take: 20 }
    );
  }

  public async markNotificationRead(userId: string, id: string): Promise<void> {
    if (id === 'all') {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() }
      });
      return;
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() }
    });
  }

  // ------------------------------------------
  // 9. Departments CRUD
  // ------------------------------------------
  public async getDepartments(): Promise<any[]> {
    return departmentRepository.findMany(
      {},
      { orderBy: { name: 'asc' } },
      { _count: { select: { users: true } } }
    );
  }

  public async createDepartment(name: string, description?: string): Promise<any> {
    return departmentRepository.create({
      name: name.trim(),
      description: description || null,
      isActive: true
    });
  }

  public async updateDepartment(id: string, name?: string, description?: string, isActive?: boolean): Promise<any> {
    return departmentRepository.update(id, {
      name: name ? name.trim() : undefined,
      description: description !== undefined ? description : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined
    });
  }

  public async deleteDepartment(id: string): Promise<void> {
    await prisma.user.updateMany({ where: { departmentId: id }, data: { departmentId: null } });
    await departmentRepository.delete(id);
  }

  // ------------------------------------------
  // 10. Practice Areas CRUD
  // ------------------------------------------
  public async getPracticeAreas(): Promise<any[]> {
    return practiceAreaRepository.findMany(
      {},
      { orderBy: { name: 'asc' } },
      { _count: { select: { cases: true } } }
    );
  }

  public async createPracticeArea(data: { name: string; code: string; description?: string; icon?: string }): Promise<any> {
    return practiceAreaRepository.create({
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      description: data.description || null,
      icon: data.icon || null,
      isActive: true
    });
  }

  public async updatePracticeArea(id: string, data: { name?: string; code?: string; description?: string; icon?: string; isActive?: boolean }): Promise<any> {
    return practiceAreaRepository.update(id, {
      name: data.name ? data.name.trim() : undefined,
      code: data.code ? data.code.trim().toUpperCase() : undefined,
      description: data.description !== undefined ? data.description : undefined,
      icon: data.icon !== undefined ? data.icon : undefined,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined
    });
  }

  public async deletePracticeArea(id: string): Promise<boolean> {
    const caseCount = await prisma.case.count({ where: { practiceAreaId: id } });
    if (caseCount > 0) {
      await practiceAreaRepository.update(id, { isActive: false });
      return false; // marked inactive
    }
    await practiceAreaRepository.delete(id);
    return true; // deleted
  }

  // ------------------------------------------
  // 11. Calendar Events CRUD
  // ------------------------------------------
  public async getCalendarEvents(startDate?: string, endDate?: string): Promise<any[]> {
    const where: any = {};
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }
    return calendarEventRepository.findMany(
      where,
      { orderBy: { startTime: 'asc' } },
      { case: { select: { id: true, title: true, internalReference: true } } }
    );
  }

  public async createCalendarEvent(data: any): Promise<any> {
    const { title, eventType = 'meeting', startTime, endTime, allDay, location, description, colorCode, caseId } = data;
    return calendarEventRepository.create({
      title: title.trim(),
      eventType,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : new Date(new Date(startTime).getTime() + 60 * 60 * 1000),
      allDay: Boolean(allDay),
      location: location || null,
      description: description || null,
      colorCode: colorCode || '#4F46E5',
      caseId: caseId || null
    }, { case: true });
  }

  public async updateCalendarEvent(id: string, data: any): Promise<any> {
    return calendarEventRepository.update(id, {
      title: data.title ? data.title.trim() : undefined,
      eventType: data.eventType || undefined,
      startTime: data.startTime ? new Date(data.startTime) : undefined,
      endTime: data.endTime ? new Date(data.endTime) : undefined,
      allDay: data.allDay !== undefined ? Boolean(data.allDay) : undefined,
      location: data.location !== undefined ? data.location : undefined,
      description: data.description !== undefined ? data.description : undefined,
      colorCode: data.colorCode || undefined
    });
  }

  public async deleteCalendarEvent(id: string): Promise<void> {
    await calendarEventRepository.delete(id);
  }
}

export const systemService = new SystemService();
