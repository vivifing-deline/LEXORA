import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');
const seedPath = path.resolve(__dirname, '../../prisma/seed.ts');

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

    // Verify tables exist and auto-sync schema if missing
    try {
      await prisma.user.count();
    } catch (checkErr: any) {
      if (checkErr?.message?.includes("doesn't exist") || checkErr?.message?.includes("does not exist")) {
        logger.info('Database tables not found. Automatically pushing Prisma schema to MySQL...');
        execSync(`npx prisma db push --schema="${schemaPath}" --skip-generate --accept-data-loss`, {
          stdio: 'inherit',
          env: { ...process.env, DATABASE_URL: config.databaseUrl }
        });
        logger.info('Prisma schema synchronized successfully.');
      }
    }

    // Auto-seed if database is empty
    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        logger.info('Database is empty (0 users found). Automatically running initial database seed...');
        execSync(`npx tsx "${seedPath}"`, {
          stdio: 'inherit',
          env: { ...process.env, DATABASE_URL: config.databaseUrl }
        });
        logger.info('Database seeded successfully.');
      }
    } catch (seedErr: any) {
      logger.warn(`Auto-seed notice: ${seedErr?.message || seedErr}`);
    }
  } catch (error: any) {
    logger.error(`Failed to connect to database: ${error?.message || error}`, error);
    process.exit(1);
  }
};

export default prisma;
