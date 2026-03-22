import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendCreated } from '../utils/response';
import * as merchantService from '../services/merchant.service';

// ─── DASHBOARD ───

export async function getDashboard(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const dashboard = await merchantService.getDashboard(id);
    sendSuccess(res, { dashboard });
}

// ─── SERVICE CATALOG ───

export async function listServices(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const services = await merchantService.listMerchantServices(id);
    sendSuccess(res, { services });
}

export async function enableService(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const service = await merchantService.enableService(id, req.body);
    sendCreated(res, { service });
}

export async function updateService(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const service = await merchantService.updateMerchantService(userId, String(req.params.id), req.body);
    sendSuccess(res, { service });
}

export async function disableService(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    await merchantService.disableService(userId, String(req.params.id));
    sendSuccess(res, null, 'Service disabled');
}

export async function createCustomService(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const result = await merchantService.createCustomService(userId, req.body);
    sendCreated(res, { service: result });
}

// ─── ORDERS ───

export async function listOrders(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const { status, page, limit } = req.query;
    const result = await merchantService.listMerchantOrders(id, {
        status: status as string | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    sendSuccess(res, result);
}

export async function getOrder(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const booking = await merchantService.getMerchantOrder(userId, String(req.params.id));
    sendSuccess(res, { booking });
}

export async function acceptOrder(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const booking = await merchantService.acceptOrder(userId, String(req.params.id));
    sendSuccess(res, { booking });
}

export async function rejectOrder(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const booking = await merchantService.rejectOrder(userId, String(req.params.id));
    sendSuccess(res, { booking });
}

export async function assignAgent(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const booking = await merchantService.assignAgent(userId, String(req.params.id), req.body);
    sendSuccess(res, { booking });
}

// ─── AGENTS ───

export async function listAgents(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const agents = await merchantService.listAgents(id);
    sendSuccess(res, { agents });
}

export async function createAgent(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const agent = await merchantService.createAgent(id, req.body);
    sendCreated(res, { agent });
}

export async function updateAgent(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const agent = await merchantService.updateAgent(userId, String(req.params.id), req.body);
    sendSuccess(res, { agent });
}

export async function getAgentLiveLocations(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const agents = await merchantService.getAgentLiveLocations(id);
    sendSuccess(res, { agents });
}

export async function getAgentStatusGrid(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const agents = await merchantService.getAgentStatusGrid(id);
    sendSuccess(res, { agents });
}

export async function mockAgentLocation(req: Request, res: Response) {
    const { userId, lat, lng } = req.body;
    const agent = await merchantService.updateAgentLocation(userId, Number(lat), Number(lng));
    sendSuccess(res, { agent });
}

// ─── SLOTS ───

export async function listSlots(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const { date } = req.query;
    const slots = await merchantService.listSlots(id, date as string | undefined);
    sendSuccess(res, { slots });
}

export async function createSlots(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const result = await merchantService.createSlots(id, req.body);
    sendCreated(res, { created: result.count });
}

// ─── EARNINGS ───

export async function getEarnings(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const { period, page, limit } = req.query;
    const result = await merchantService.getEarnings(id, {
        period: (period as 'day' | 'week' | 'month') || 'month',
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    sendSuccess(res, result);
}

// ─── KYC ───

export async function submitKycDoc(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const doc = await merchantService.submitKycDoc(id, req.body);
    sendCreated(res, { document: doc });
}

// ─── PROMOTIONS ───

export async function listPromotions(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const promotions = await merchantService.listPromotions(id);
    sendSuccess(res, { promotions });
}

export async function createPromotion(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const promotion = await merchantService.createPromotion(id, req.body);
    sendCreated(res, { promotion });
}

export async function updatePromotion(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const promotion = await merchantService.updatePromotion(userId, String(req.params.id), req.body);
    sendSuccess(res, { promotion });
}

// ─── ANALYTICS ───

export async function getAnalytics(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const periodDays = req.query.days ? parseInt(String(req.query.days), 10) : 30;
    const analytics = await merchantService.getAnalytics(id, periodDays);
    sendSuccess(res, { analytics });
}

// ─── SETTINGS ───

export async function getSettings(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const settings = await merchantService.getSettings(id);
    sendSuccess(res, { settings });
}

export async function updateSettings(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const settings = await merchantService.updateSettings(id, req.body);
    sendSuccess(res, { settings });
}

// ─── REVIEWS ───

export async function listReviews(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const { page, limit } = req.query;
    const result = await merchantService.listReviews(id, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    sendSuccess(res, result);
}

export async function replyToReview(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const review = await merchantService.replyToReview(userId, String(req.params.id), req.body.reply);
    sendSuccess(res, { review });
}

// ─── CHAT ───

export async function listChats(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const chats = await merchantService.listChats(id);
    sendSuccess(res, { chats });
}

export async function openChat(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const chat = await merchantService.getOrCreateChat(id, String(req.params.bookingId), 'MERCHANT');
    sendSuccess(res, { chat });
}

export async function getChatMessages(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const { page, limit } = req.query;
    const result = await merchantService.getChatMessages(id, String(req.params.chatId), {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    sendSuccess(res, result);
}

export async function sendChatMessage(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const message = await merchantService.sendChatMessage(id, String(req.params.chatId), req.body.content);
    sendCreated(res, { message });
}

// ─── NOTIFICATIONS ───

export async function listNotifications(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const { unreadOnly, page, limit } = req.query;
    const result = await merchantService.listNotifications(id, {
        unreadOnly: unreadOnly === 'true',
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    sendSuccess(res, result);
}

export async function markNotificationRead(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const notification = await merchantService.markNotificationRead(userId, String(req.params.id));
    sendSuccess(res, { notification });
}

export async function markAllNotificationsRead(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    await merchantService.markAllNotificationsRead(id);
    sendSuccess(res, null, 'All notifications marked as read');
}

export async function updatePushToken(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    await merchantService.updatePushToken(id, req.body.token);
    sendSuccess(res, null, 'Push token updated');
}
