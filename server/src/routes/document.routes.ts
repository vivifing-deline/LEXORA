import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env.js';
import { documentController } from '../controllers/document.controller.js';
import { authenticateJWT, requirePermission } from '../middleware/auth.middleware.js';
import { PERMISSIONS } from '../constants/permissions.constant.js';

export const documentRouter: Router = Router();

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG'));
    }
  }
});

documentRouter.use(authenticateJWT);

documentRouter.get('/', requirePermission(PERMISSIONS.DOCUMENT_VIEW), documentController.getDocuments);
documentRouter.get('/:id', requirePermission(PERMISSIONS.DOCUMENT_VIEW), documentController.getDocumentById);
documentRouter.post('/upload', requirePermission(PERMISSIONS.DOCUMENT_UPLOAD), upload.single('file'), documentController.uploadDocument);
documentRouter.put('/:id', requirePermission(PERMISSIONS.DOCUMENT_UPLOAD), documentController.updateDocument);
documentRouter.delete('/:id', requirePermission(PERMISSIONS.DOCUMENT_DELETE), documentController.deleteDocument);
documentRouter.get('/:id/download', requirePermission(PERMISSIONS.DOCUMENT_DOWNLOAD), documentController.downloadDocument);

// Legal References
documentRouter.get('/research/references', documentController.getLegalReferences);
documentRouter.post('/research/references', documentController.createLegalReference);
documentRouter.put('/research/references/:id', documentController.updateLegalReference);
documentRouter.delete('/research/references/:id', documentController.deleteLegalReference);

export default documentRouter;

