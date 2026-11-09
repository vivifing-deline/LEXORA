import { PrismaClient } from '@prisma/client';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient({
  datasources: config.databaseUrl ? {
    db: {
      url: config.databaseUrl
    }
  } : undefined,
  log: config.isDev ? ['warn', 'error'] : ['error']
});

export const connectDB = async (): Promise<void> => {
  if (!config.databaseUrl && !process.env.DATABASE_URL) {
    logger.error('CRITICAL: DATABASE_URL is not set! Please add the DATABASE_URL variable referencing your MySQL database in Railway.');
    process.exit(1);
  }

  try {
    await prisma.$connect();
    const dbType = (config.databaseUrl || process.env.DATABASE_URL || '').startsWith('mysql') ? 'MySQL' : 'Database';
    logger.info(`Connected to ${dbType} [${config.appMode.toUpperCase()} MODE]`);
  } catch (error: any) {
    logger.error(`Failed to connect to database: ${error?.message || error}`, error);
    process.exit(1);
  }
};

export default prisma;
