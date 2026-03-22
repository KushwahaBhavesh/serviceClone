import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendCreated } from '../utils/response';
import { BadRequestError, NotFoundError } from '../middleware/error-handler';
import * as agentService from '../services/agent.service';
import * as chatService from '../services/chat.service';
import * as notificationService from '../services/notification.service';
import prisma from '../lib/prisma';

// ─── Helpers ───

async function getAgentFromUser(userId: string) {
    const agent = await prisma.agent.findUnique({ where: { userId } });
    if (!agent) throw new NotFoundError('Agent profile not found');
    return agent;
}

// ─── DASHBOARD ───

export async function getDashboard(req: Request, res: Response) {
    const agent = await getAgentFromUser((req as AuthenticatedRequest).user.id);
    const stats = await agentService.getDashboardStats(agent.id);
    sendSuccess(res, stats);
}

// ─── JOBS ───

export async function getJobs(req: Request, res: Response) {
    const agent = await getAgentFromUser((req as AuthenticatedRequest).user.id);
    const jobs = await agentService.getAssignedJobs(agent.id);
    sendSuccess(res, jobs);
}

export async function getJobDetails(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const job = await agentService.getJobDetails(userId, String(req.params.id));
    if (!job) throw new NotFoundError('Job not found');
    sendSuccess(res, job);
}

export async function updateJobStatus(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const { status } = req.body;
    if (!status) throw new BadRequestError('Status is required');
    const updatedJob = await agentService.updateJobStatus(userId, String(req.params.id), status);
    sendSuccess(res, updatedJob);
}

export async function getJobHistory(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await agentService.getJobHistory(id, page, limit);
    sendSuccess(res, result);
}

// ─── AVAILABILITY & LOCATION ───

export async function updateAvailability(req: Request, res: Response) {
    const { isOnline } = req.body;
    if (typeof isOnline !== 'boolean') throw new BadRequestError('isOnline must be a boolean');
    const agent = await getAgentFromUser((req as AuthenticatedRequest).user.id);
    const result = await agentService.updateAvailability(agent.id, isOnline);
    sendSuccess(res, result, 'Availability updated');
}

export async function updateLocation(req: Request, res: Response) {
    const { lat, lng } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
        throw new BadRequestError('Latitude and longitude must be numbers');
    }
    const agent = await getAgentFromUser((req as AuthenticatedRequest).user.id);
    const result = await agentService.updateLocation(agent.id, lat, lng);
    sendSuccess(res, result, 'Location updated');
}

// ─── CHAT ───

export async function openChat(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const chat = await chatService.getOrCreateChat(id, String(req.params.bookingId), 'AGENT');
    sendSuccess(res, { chat });
}

export async function getChatMessages(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const { page, limit } = req.query;
    const result = await chatService.getChatMessages(id, String(req.params.chatId), {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    sendSuccess(res, result);
}

export async function sendChatMessage(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const { content } = req.body;
    if (!content) throw new BadRequestError('Content is required');
    const message = await chatService.sendChatMessage(id, String(req.params.chatId), content);
    sendCreated(res, { message });
}

// ─── NOTIFICATIONS ───

export async function listNotifications(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const { unreadOnly, page, limit } = req.query;
    const result = await notificationService.listNotifications(id, {
        unreadOnly: unreadOnly === 'true',
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    sendSuccess(res, result);
}

export async function markNotificationRead(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const notification = await notificationService.markNotificationRead(userId, String(req.params.id));
    sendSuccess(res, { notification });
}

export async function markAllNotificationsRead(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    await notificationService.markAllNotificationsRead(id);
    sendSuccess(res, null, 'All notifications marked as read');
}

export async function updatePushToken(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const { token } = req.body;
    if (!token) throw new BadRequestError('Token is required');
    await notificationService.updatePushToken(id, token);
    sendSuccess(res, null, 'Push token updated');
}
