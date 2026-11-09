import { PrismaClient } from '@prisma/client';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.databaseUrl
    }
  },
  log: config.isDev ? ['warn', 'error'] : ['error']
});

export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    const dbType = config.databaseUrl.startsWith('mysql') ? 'MySQL' : 'SQLite';
    logger.info(`Connected to ${dbType} [${config.appMode.toUpperCase()} MODE]`);
  } catch (error) {
    logger.error('Failed to connect to database', error);
    process.exit(1);
  }
};

export default prisma;
