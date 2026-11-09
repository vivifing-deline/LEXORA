import fs from 'fs';
import path from 'path';
import prisma from '../config/db.js';
import { documentRepository, DocumentRepository } from '../repositories/document.repository.js';
import { IDocumentFilter } from '../interfaces/document.interface.js';
import { IPaginatedResult } from '../interfaces/pagination.interface.js';
import { AuditAction } from '../enums/index.js';

export class DocumentService {
  public constructor(private readonly repo: DocumentRepository = documentRepository) {}

  public async getDocuments(filter: IDocumentFilter): Promise<IPaginatedResult<any>> {
    return this.repo.getFilteredDocuments(filter);
  }

  public async getDocumentById(id: string, workspaceId: string): Promise<any> {
    return prisma.document.findFirst({
      where: { id, workspaceId },
      include: {
        case: true,
        client: true,
        uploadedBy: true,
        versions: { orderBy: { versionNumber: 'desc' } }
      }
    });
  }

  public async uploadDocument(
    workspaceId: string,
    userId: string,
    userEmail: string,
    file: Express.Multer.File,
    data: any,
    userIp?: string
  ): Promise<any> {
    const { title, caseId, clientId, category = 'Other', tags, description, isConfidential } = data;

    const doc = await prisma.document.create({
      data: {
        workspaceId,
        caseId: caseId || null,
        clientId: clientId || null,
        title: title ? title.trim() : file.originalname,
        originalName: file.originalname,
        storedFilename: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        extension: path.extname(file.originalname).replace('.', '').toLowerCase(),
        category,
        tags: tags || null,
        description: description || null,
        isConfidential: isConfidential === 'true' || isConfidential === true,
        uploadedById: userId,
        versions: {
          create: {
            versionNumber: 1,
            storedFilename: file.filename,
            filePath: file.path,
            fileSize: file.size,
            changesSummary: 'Initial document upload',
            uploadedBy: userEmail
          }
        }
      },
      include: {
        case: true,
        client: true,
        uploadedBy: { select: { firstName: true, lastName: true } }
      }
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId,
        action: AuditAction.CREATE,
        module: 'Documents',
        entityId: doc.id,
        entityName: doc.title,
        ipAddress: userIp
      }
    });

    return doc;
  }

  public async updateDocument(id: string, updates: any): Promise<any> {
    return prisma.document.update({
      where: { id },
      data: {
        title: updates.title ? updates.title.trim() : undefined,
        category: updates.category || undefined,
        tags: updates.tags !== undefined ? updates.tags : undefined,
        description: updates.description !== undefined ? updates.description : undefined,
        isConfidential: updates.isConfidential !== undefined ? Boolean(updates.isConfidential) : undefined
      }
    });
  }

  public async deleteDocument(id: string, userId: string, userIp?: string): Promise<void> {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return;

    if (fs.existsSync(doc.filePath)) {
      try {
        fs.unlinkSync(doc.filePath);
      } catch (err) {}
    }

    await prisma.documentVersion.deleteMany({ where: { documentId: id } });
    await prisma.documentAccess.deleteMany({ where: { documentId: id } });
    await prisma.document.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        workspaceId: doc.workspaceId,
        userId,
        action: AuditAction.DELETE,
        module: 'Documents',
        entityId: id,
        entityName: doc.title,
        ipAddress: userIp
      }
    });
  }

  // Legal Reference Library
  public async getLegalReferences(query: { search?: string; category?: string }): Promise<any[]> {
    const where: any = {};
    if (query.category) where.category = String(query.category);
    if (query.search) {
      const q = String(query.search);
      where.OR = [
        { title: { contains: q } },
        { actName: { contains: q } },
        { sectionRule: { contains: q } },
        { citation: { contains: q } },
        { summary: { contains: q } },
        { tags: { contains: q } }
      ];
    }

    return prisma.legalReference.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  public async createLegalReference(data: any): Promise<any> {
    return prisma.legalReference.create({ data });
  }

  public async updateLegalReference(id: string, data: any): Promise<any> {
    return prisma.legalReference.update({ where: { id }, data });
  }

  public async deleteLegalReference(id: string): Promise<void> {
    await prisma.caseLegalReference.deleteMany({ where: { legalReferenceId: id } });
    await prisma.legalReference.delete({ where: { id } });
  }
}

export const documentService = new DocumentService();

