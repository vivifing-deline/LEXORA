import prisma from '../config/db.js';
import { clientRepository, ClientRepository } from '../repositories/client.repository.js';
import { IClientFilter, ICreateClientDto, IUpdateClientDto } from '../interfaces/client.interface.js';
import { IPaginatedResult } from '../interfaces/pagination.interface.js';
import { AuditAction } from '../enums/index.js';

export class ClientService {
  public constructor(private readonly repo: ClientRepository = clientRepository) {}

  public async getClients(filter: IClientFilter): Promise<IPaginatedResult<any>> {
    return this.repo.getFilteredClients(filter);
  }

  public async getClientById(id: string, workspaceId: string): Promise<any> {
    return prisma.client.findFirst({
      where: { id, workspaceId },
      include: {
        assignedAdvocate: {
          select: { id: true, firstName: true, lastName: true, email: true, designation: true, phone: true }
        },
        contacts: true,
        cases: {
          include: {
            practiceArea: true,
            court: true,
            assignments: { include: { user: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        invoices: {
          include: { items: true, payments: true },
          orderBy: { issueDate: 'desc' }
        },
        documents: {
          include: { uploadedBy: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' }
        },
        tasks: {
          include: { assignments: { include: { user: true } } },
          orderBy: { dueDate: 'asc' }
        }
      }
    });
  }

  public async createClient(workspaceId: string, data: ICreateClientDto, userId: string, userIp?: string): Promise<any> {
    const {
      name,
      type = 'individual',
      clientReference,
      email,
      phone,
      address,
      city,
      jurisdiction,
      cnicPassport,
      notes,
      assignedAdvocateId,
      contacts
    } = data;

    let finalRef = clientReference;
    if (!finalRef) {
      const count = await this.repo.count({ workspaceId });
      const year = new Date().getFullYear();
      finalRef = `CLT-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    const newClient = await prisma.client.create({
      data: {
        workspaceId,
        clientReference: finalRef,
        name: name.trim(),
        type,
        email: email ? email.trim() : null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        jurisdiction: jurisdiction || null,
        nationalId: cnicPassport || null,
        notes: notes || null,
        assignedAdvocateId: assignedAdvocateId || null,
        contacts: contacts && contacts.length > 0 ? {
          create: contacts.map(c => ({
            name: c.name.trim(),
            designation: c.designation || null,
            email: c.email || null,
            phone: c.phone || null,
            isPrimary: Boolean(c.isPrimary)
          }))
        } : undefined
      },
      include: {
        assignedAdvocate: true,
        contacts: true
      }
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId,
        action: AuditAction.CREATE,
        module: 'Clients',
        entityId: newClient.id,
        entityName: newClient.name,
        newValues: JSON.stringify({ reference: finalRef, name }),
        ipAddress: userIp
      }
    });

    return newClient;
  }

  public async updateClient(id: string, workspaceId: string, updates: IUpdateClientDto, userId: string, userIp?: string): Promise<any> {
    const existing = await prisma.client.findFirst({ where: { id, workspaceId } });
    if (!existing) return null;

    const updated = await prisma.client.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name.trim() }),
        ...(updates.type && { type: updates.type }),
        ...(updates.email !== undefined && { email: updates.email ? updates.email.trim() : null }),
        ...(updates.phone !== undefined && { phone: updates.phone }),
        ...(updates.address !== undefined && { address: updates.address }),
        ...(updates.city !== undefined && { city: updates.city }),
        ...(updates.jurisdiction !== undefined && { jurisdiction: updates.jurisdiction }),
        ...(updates.cnicPassport !== undefined && { nationalId: updates.cnicPassport }),
        ...(updates.status && { status: updates.status }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
        ...(updates.assignedAdvocateId !== undefined && { assignedAdvocateId: updates.assignedAdvocateId })
      },
      include: {
        assignedAdvocate: true,
        contacts: true
      }
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId,
        action: AuditAction.UPDATE,
        module: 'Clients',
        entityId: updated.id,
        entityName: updated.clientReference,
        oldValues: JSON.stringify({ status: existing.status }),
        newValues: JSON.stringify({ status: updated.status }),
        ipAddress: userIp
      }
    });

    return updated;
  }

  public async deleteClient(id: string, workspaceId: string, userId: string, userIp?: string): Promise<{ archived: boolean; client?: any }> {
    const client = await prisma.client.findFirst({
      where: { id, workspaceId },
      include: {
        _count: { select: { cases: true, invoices: true, documents: true } }
      }
    });

    if (!client) throw new Error('Client not found');

    if (client._count.cases > 0 || client._count.invoices > 0) {
      const archived = await prisma.client.update({
        where: { id },
        data: { status: 'archived' }
      });

      await prisma.auditLog.create({
        data: {
          workspaceId,
          userId,
          action: 'ARCHIVE',
          module: 'Clients',
          entityId: id,
          entityName: client.name,
          newValues: JSON.stringify({ reason: 'Client archived because associated records exist' }),
          ipAddress: userIp
        }
      });

      return { archived: true, client: archived };
    }

    await prisma.clientContact.deleteMany({ where: { clientId: id } });
    await prisma.client.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId,
        action: AuditAction.DELETE,
        module: 'Clients',
        entityId: id,
        entityName: client.name,
        ipAddress: userIp
      }
    });

    return { archived: false };
  }

  public async addContact(clientId: string, data: { name: string; designation?: string; email?: string; phone?: string; isPrimary?: boolean; notes?: string }): Promise<any> {
    return prisma.clientContact.create({
      data: {
        clientId,
        name: data.name.trim(),
        designation: data.designation || null,
        email: data.email || null,
        phone: data.phone || null,
        isPrimary: Boolean(data.isPrimary),
        notes: data.notes || null
      }
    });
  }

  public async updateContact(contactId: string, data: any): Promise<any> {
    return prisma.clientContact.update({
      where: { id: contactId },
      data
    });
  }

  public async deleteContact(contactId: string): Promise<any> {
    return prisma.clientContact.delete({ where: { id: contactId } });
  }

  public async checkConflicts(workspaceId: string, query: string): Promise<any> {
    const q = query.trim();
    if (!q) return { matchingClients: [], matchingOpposingParties: [] };

    const [matchingClients, matchingCases] = await Promise.all([
      prisma.client.findMany({
        where: {
          workspaceId,
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { nationalId: { contains: q } }
          ]
        },
        select: { id: true, name: true, clientReference: true, type: true }
      }),
      prisma.case.findMany({
        where: {
          workspaceId,
          OR: [
            { defendantRespondent: { contains: q } },
            { plaintiffPetitioner: { contains: q } },
            { opposingCounsel: { contains: q } }
          ]
        },
        select: {
          id: true,
          title: true,
          internalReference: true,
          defendantRespondent: true,
          plaintiffPetitioner: true,
          opposingCounsel: true
        }
      })
    ]);

    return { matchingClients, matchingCases };
  }
}

export const clientService = new ClientService();
