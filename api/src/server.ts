import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth.routes';
import catalogRoutes from './routes/catalog.routes';
import bookingRoutes from './routes/booking.routes';
import merchantRoutes from './routes/merchant.routes';
import agentRoutes from './routes/agent.routes';
import customerRoutes from './routes/customer.routes';
import paymentRoutes from './routes/payment.routes';
import uploadRoutes from './routes/upload.routes';
import { errorHandler } from './middleware/error-handler';
import prisma from './lib/prisma';
import { createServer } from 'http';
import { initializeSocket } from './socket';
import morgan from 'morgan';
import logger from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Request logging
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: { write: (message) => logger.info(message.trim()) }
}));

// ─── Routes ───
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/merchant', merchantRoutes);
app.use('/api/v1/agent', agentRoutes);
app.use('/api/v1/customer', customerRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/common', uploadRoutes);

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error Handler (must be last) ───
app.use(errorHandler);

// ─── Start ───
async function start() {
    try {
        await prisma.$connect();
        logger.info('✅ Database connected');

        const httpServer = createServer(app);
        initializeSocket(httpServer);
        logger.info('🔌 Socket.IO initialized');

        httpServer.listen(PORT, () => {
            logger.info(`🚀 API running on http://localhost:${PORT}`);
        });
    } catch (error) {
        logger.error('❌ Failed to start server: %O', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

start();
