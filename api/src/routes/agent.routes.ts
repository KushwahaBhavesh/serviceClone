import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest, requireRoles } from '../middleware/auth';
import * as agentService from '../services/agent.service';
import * as chatService from '../services/chat.service';
import * as notificationService from '../services/notification.service';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

/**
 * Protect all agent routes
 */
router.use(authenticate);
router.use(requireRoles('AGENT'));

/**
 * Get Agent's Profile (maps user ID to agent ID)
 */
async function getAgentFromUser(userId: string) {
    const agent = await prisma.agent.findUnique({
        where: { userId }
    });
    if (!agent) throw new Error('Agent profile not found');
    return agent;
}

/**
 * GET /api/v1/agent/dashboard
 */
router.get('/dashboard', asyncHandler(async (req: Request, res: Response) => {
    try {
        const agent = await getAgentFromUser((req as AuthenticatedRequest).user.id);
        const stats = await agentService.getDashboardStats(agent.id);
        res.json(stats);
    } catch (error) {
        logger.error('Error fetching agent dashboard: %O', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
}));

/**
 * GET /api/v1/agent/jobs
 */
router.get('/jobs', asyncHandler(async (req: Request, res: Response) => {
    try {
        const agent = await getAgentFromUser((req as AuthenticatedRequest).user.id);
        const jobs = await agentService.getAssignedJobs(agent.id);
        res.json(jobs);
    } catch (error) {
        logger.error('Error fetching agent jobs: %O', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
}));

/**
 * GET /api/v1/agent/jobs/:id
 */
router.get('/jobs/:id', asyncHandler(async (req, res) => {
    const { id: agentId } = (req as AuthenticatedRequest).user;
    const jobId = req.params.id as string;

    const job = await agentService.getJobDetails(agentId, jobId);
    if (!job) {
        res.status(404).json({ message: 'Job not found' });
        return;
    }
    res.json(job);
}));

/**
 * PATCH /api/v1/agent/jobs/:id/status
 */
router.patch('/jobs/:id/status', asyncHandler(async (req, res) => {
    const { id: agentId } = (req as AuthenticatedRequest).user;
    const jobId = req.params.id as string;
    const { status } = req.body;

    if (!status) {
        res.status(400).json({ message: 'Status is required' });
        return;
    }

    const updatedJob = await agentService.updateJobStatus(agentId, jobId, status);
    res.json(updatedJob);
}));

/**
 * GET /api/v1/agent/history
 */
router.get('/history', asyncHandler(async (req, res) => {
    const { id } = (req as AuthenticatedRequest).user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await agentService.getJobHistory(id, page, limit);
    res.json(result);
}));

/**
 * PUT /api/v1/agent/availability
 */
router.put('/availability', asyncHandler(async (req: Request, res: Response) => {
    try {
        const { isOnline } = req.body;
        if (typeof isOnline !== 'boolean') {
            res.status(400).json({ error: 'isOnline must be a boolean' });
            return;
        }

        const agent = await getAgentFromUser((req as AuthenticatedRequest).user.id);
        const result = await agentService.updateAvailability(agent.id, isOnline);

        res.json({ message: 'Availability updated', data: result });
    } catch (error) {
        logger.error('Error updating availability: %O', error);
        res.status(500).json({ error: 'Failed to update availability' });
    }
}));

/**
 * POST /api/v1/agent/location
 */
router.post('/location', asyncHandler(async (req, res) => {
    try {
        const { lat, lng } = req.body;
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            res.status(400).json({ error: 'Latitude and longitude must be numbers' });
            return;
        }

        const agent = await getAgentFromUser((req as AuthenticatedRequest).user.id);
        const result = await agentService.updateLocation(agent.id, lat, lng);

        res.json({ message: 'Location updated', data: result });
    } catch (error) {
        logger.error('Error updating location: %O', error);
        res.status(500).json({ error: 'Failed to update location' });
    }
}));

// ─── CHAT ───

router.post('/chat/open/:bookingId', asyncHandler(async (req, res) => {
    const { id } = (req as AuthenticatedRequest).user;
    const chat = await chatService.getOrCreateChat(id, req.params.bookingId as string, 'AGENT');
    res.json({ chat });
}));

router.get('/chat/:chatId/messages', asyncHandler(async (req, res) => {
    const { id } = (req as AuthenticatedRequest).user;
    const { page, limit } = req.query;
    const result = await chatService.getChatMessages(id, req.params.chatId as string, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
}));

router.post('/chat/:chatId/messages', asyncHandler(async (req, res) => {
    const { id } = (req as AuthenticatedRequest).user;
    const { content } = req.body;
    if (!content) {
        res.status(400).json({ error: 'Content is required' });
        return;
    }
    const message = await chatService.sendChatMessage(id, req.params.chatId as string, content);
    res.status(201).json({ message });
}));

// ─── NOTIFICATIONS ───

router.get('/notifications', asyncHandler(async (req, res) => {
    const { id } = (req as AuthenticatedRequest).user;
    const { unreadOnly, page, limit } = req.query;
    const result = await notificationService.listNotifications(id, {
        unreadOnly: unreadOnly === 'true',
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
}));

router.patch('/notifications/:id/read', asyncHandler(async (req, res) => {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const notification = await notificationService.markNotificationRead(userId, req.params.id as string);
    res.json({ notification });
}));

router.post('/notifications/read-all', asyncHandler(async (req, res) => {
    const { id } = (req as AuthenticatedRequest).user;
    await notificationService.markAllNotificationsRead(id);
    res.json({ success: true });
}));

router.post('/push-token', asyncHandler(async (req, res) => {
    const { id } = (req as AuthenticatedRequest).user;
    const { token } = req.body;
    if (!token) {
        res.status(400).json({ error: 'Token is required' });
        return;
    }
    await notificationService.updatePushToken(id, token);
    res.json({ success: true });
}));

export default router;
