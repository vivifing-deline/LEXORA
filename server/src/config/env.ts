import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '../../');

// Determine env file to load
const requestedMode = process.env.APP_MODE || '';
const requestedNodeEnv = process.env.NODE_ENV || 'development';

// 1. Try mode-specific file first if requested via CLI, or default .env
let envFile = '.env';
if (requestedMode === 'demo') {
  envFile = '.env.demo';
} else if (requestedMode === 'normal') {
  envFile = requestedNodeEnv === 'production' ? '.env.production' : '.env.development';
}

const envFilePath = path.resolve(serverRoot, envFile);
if (fs.existsSync(envFilePath)) {
  dotenv.config({ path: envFilePath });
} else {
  dotenv.config({ path: path.resolve(serverRoot, '.env') });
}

const nodeEnv = process.env.NODE_ENV || 'development';
const appMode = (process.env.APP_MODE === 'normal' ? 'normal' : 'demo') as 'demo' | 'normal';
const isProd = nodeEnv === 'production';
const isDev = nodeEnv === 'development';
const demoMode = isProd ? false : (process.env.DEMO_MODE === 'true' || appMode === 'demo');
const demoResetEnabled = isProd ? false : (process.env.DEMO_RESET_ENABLED === 'true' && demoMode);
const allowDemoDataSeed = isProd ? false : (process.env.ALLOW_DEMO_DATA_SEED === 'true' && demoMode);

// Safety validation in production
if (isProd) {
  if (process.env.DEMO_MODE === 'true' || process.env.DEMO_RESET_ENABLED === 'true') {
    throw new Error('SECURITY VIOLATION: Demo mode and demo reset are strictly forbidden in production!');
  }
}

// Database URL handling with strict data isolation
let rawDbUrl = process.env.DATABASE_URL;
let dbFileName = appMode === 'demo' ? 'lexora-demo.db' : 'lexora.db';

let normalizedDatabaseUrl: string;
let resolvedDbPath: string;

if (rawDbUrl && !rawDbUrl.startsWith('file:')) {
  normalizedDatabaseUrl = rawDbUrl;
  resolvedDbPath = rawDbUrl;
  process.env.DATABASE_URL = normalizedDatabaseUrl;
} else {
  if (!rawDbUrl) {
    rawDbUrl = `file:../data/${dbFileName}`;
  }

  // Ensure data folder exists
  const dataDir = path.resolve(serverRoot, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Resolve SQLite path to absolute path to prevent ambiguity across working directories
  resolvedDbPath = path.resolve(dataDir, dbFileName);
  if (rawDbUrl.startsWith('file:')) {
    const filePathPart = rawDbUrl.replace(/^file:/, '');
    if (path.isAbsolute(filePathPart)) {
      resolvedDbPath = filePathPart;
    } else {
      // Relative to server/prisma or server/
      resolvedDbPath = path.resolve(serverRoot, 'prisma', filePathPart);
      if (!fs.existsSync(path.dirname(resolvedDbPath))) {
        resolvedDbPath = path.resolve(serverRoot, filePathPart);
      }
    }
  }
  normalizedDatabaseUrl = `file:${resolvedDbPath}`;
  process.env.DATABASE_URL = normalizedDatabaseUrl;
}

// Upload directory handling
const defaultUploadDir = path.resolve(serverRoot, '../storage/uploads');
const uploadDir = process.env.UPLOAD_DIR ? path.resolve(serverRoot, process.env.UPLOAD_DIR) : defaultUploadDir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  isProd,
  isDev,
  appMode,
  demoMode,
  demoResetEnabled,
  allowDemoDataSeed,
  databaseUrl: normalizedDatabaseUrl,
  databasePath: resolvedDbPath,
  jwtSecret: process.env.JWT_SECRET || 'lexora_super_secret_jwt_key_2026_antigravity',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  uploadDir,
  version: '1.0.0'
};

export const getSafeClientConfig = () => ({
  appMode: config.appMode,
  demoMode: config.demoMode,
  demoResetEnabled: config.demoResetEnabled,
  version: config.version,
  environment: config.nodeEnv
});
