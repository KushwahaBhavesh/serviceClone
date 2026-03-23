import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { createServer } from 'http';
import morgan from 'morgan';

import { env } from './config/env';

import authRoutes from './routes/auth.routes';
import catalogRoutes from './routes/catalog.routes';
import bookingRoutes from './routes/booking.routes';
import merchantRoutes from './routes/merchant.routes';
import agentRoutes from './routes/agent.routes';
import customerRoutes from './routes/customer.routes';
import paymentRoutes from './routes/payment.routes';
import uploadRoutes from './routes/upload.routes';
import { errorHandler } from './middleware/error-handler';
import { requestId } from './middleware/request-id';
import { requestTimeout } from './middleware/timeout';
import { globalLimiter, authLimiter, uploadLimiter } from './middleware/rate-limiter';

import prisma from './lib/prisma';
import { initializeSocket } from './socket';
import logger from './utils/logger';

const app = express();

// Trust first proxy (e.g. Expo, ngrok, load balancers)
// Fixes ERR_ERL_UNEXPECTED_X_FORWARDED_FOR from express-rate-limit
app.set('trust proxy', 1);

// ─── Security Middleware ───
app.use(helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const corsOrigins = env.CORS_ORIGINS === '*'
    ? '*'
    : env.CORS_ORIGINS.split(',').map(o => o.trim());

app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Parse Middleware ───
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ─── Observability Middleware ───
app.use(requestId);
app.use(morgan(':method :url :status :res[content-length] - :response-time ms [:req[x-request-id]]', {
    stream: { write: (message) => logger.info(message.trim()) }
}));

// ─── Fault Tolerance Middleware ───
app.use(globalLimiter);
app.use(requestTimeout(30000));

// ─── Routes ───
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/merchant', merchantRoutes);
app.use('/api/v1/agent', agentRoutes);
app.use('/api/v1/customer', customerRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/common', uploadLimiter, uploadRoutes);

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// ─── Health Check (verifies DB) ───
app.get('/health', async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({
            success: true,
            data: {
                status: 'ok',
                db: 'connected',
                uptime: process.uptime(),
                memory: process.memoryUsage().rss,
                environment: env.NODE_ENV,
            },
            message: 'Healthy',
        });
    } catch (error) {
        logger.error('Health check failed: DB unreachable');
        res.status(503).json({
            success: false,
            data: { status: 'degraded', db: 'disconnected' },
            message: 'Service unavailable',
        });
    }
});

// ─── Error Handler (must be last) ───
app.use(errorHandler);

// ─── Start ───
let httpServer: ReturnType<typeof createServer>;

async function start() {
    try {
        await prisma.$connect();
        logger.info('✅ Database connected');

        httpServer = createServer(app);
        initializeSocket(httpServer);
        logger.info('🔌 Socket.IO initialized');

        httpServer.listen(env.PORT, () => {
            logger.info(`🚀 API running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
            logger.info('🛡️  Security: helmet=on, rate-limit=100/min, timeout=30s, body-limit=50kb');
        });
    } catch (error) {
        logger.error('❌ Failed to start server: %O', error);
        process.exit(1);
    }
}

// ─── Graceful Shutdown ───
async function gracefulShutdown(signal: string) {
    logger.info(`📴 ${signal} received — starting graceful shutdown...`);

    if (httpServer) {
        httpServer.close(() => {
            logger.info('✅ HTTP server closed — no new connections');
        });
    }

    const drainTimeout = setTimeout(() => {
        logger.warn('⚠️  Drain timeout exceeded — forcing shutdown');
        process.exit(1);
    }, 10000);

    try {
        await prisma.$disconnect();
        logger.info('✅ Database disconnected');

        clearTimeout(drainTimeout);
        logger.info('✅ Graceful shutdown complete');
        process.exit(0);
    } catch (error) {
        logger.error('❌ Error during shutdown: %O', error);
        clearTimeout(drainTimeout);
        process.exit(1);
    }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ─── Catch Unhandled Errors ───
process.on('unhandledRejection', (reason: unknown) => {
    logger.error('🔥 Unhandled Promise Rejection: %O', reason);
});

process.on('uncaughtException', (error: Error) => {
    logger.error('🔥 Uncaught Exception: %O', error);
    process.exit(1);
});

if (process.env.NODE_ENV !== 'test') {
    start();
}

export default app;
