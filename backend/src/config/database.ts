import { PrismaClient } from '@prisma/client';
import { env } from './env';

const prisma = new PrismaClient({
  log: env.isDev ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
