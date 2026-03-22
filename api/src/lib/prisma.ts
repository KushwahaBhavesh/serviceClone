import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

// Singleton pattern — prevents multiple instances during dev hot-reload
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: [
            { level: 'error', emit: 'event' },
            { level: 'warn', emit: 'event' },
            { level: 'query', emit: 'event' },
        ],
    });

// ─── Query performance logging ───
prisma.$on('query' as never, (e: any) => {
    if (e.duration > 500) {
        logger.warn('Slow query (%dms): %s', e.duration, e.query?.substring(0, 200));
    }
});

prisma.$on('error' as never, (e: any) => {
    logger.error('Prisma error: %s', e.message);
});

prisma.$on('warn' as never, (e: any) => {
    logger.warn('Prisma warning: %s', e.message);
});

// Prevent multiple instances in dev
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
