import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest, requireRoles } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
    updateMerchantProfileSchema,
    createMerchantServiceSchema,
    updateMerchantServiceSchema,
    createAgentSchema,
    updateAgentSchema,
    createSlotsSchema,
    assignAgentSchema,
    submitKycDocSchema,
    createPromotionSchema,
    updatePromotionSchema,
    replyToReviewSchema,
    sendMessageSchema,
    updatePushTokenSchema,
} from '../validators/merchant.validators';
import * as merchantService from '../services/merchant.service';

const router = Router();

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

// All routes require authentication + MERCHANT role
router.use(authenticate, requireRoles('MERCHANT'));

// ─── DASHBOARD ───

router.get(
    '/dashboard',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const dashboard = await merchantService.getDashboard(id);
        res.json({ dashboard });
    }),
);

// ─── SERVICE CATALOG ───

router.get(
    '/services',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const services = await merchantService.listMerchantServices(id);
        res.json({ services });
    }),
);

router.post(
    '/services',
    validate(createMerchantServiceSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const service = await merchantService.enableService(id, req.body);
        res.status(201).json({ service });
    }),
);

router.put(
    '/services/:id',
    validate(updateMerchantServiceSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const service = await merchantService.updateMerchantService(userId, String(req.params.id), req.body);
        res.json({ service });
    }),
);

router.delete(
    '/services/:id',
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        await merchantService.disableService(userId, String(req.params.id));
        res.json({ message: 'Service disabled' });
    }),
);

// ─── ORDERS ───

router.get(
    '/orders',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const { status, page, limit } = req.query;
        const result = await merchantService.listMerchantOrders(id, {
            status: status as string | undefined,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
        res.json(result);
    }),
);

router.get(
    '/orders/:id',
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const booking = await merchantService.getMerchantOrder(userId, String(req.params.id));
        res.json({ booking });
    }),
);

router.patch(
    '/orders/:id/accept',
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const booking = await merchantService.acceptOrder(userId, String(req.params.id));
        res.json({ booking });
    }),
);

router.patch(
    '/orders/:id/reject',
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const booking = await merchantService.rejectOrder(userId, String(req.params.id));
        res.json({ booking });
    }),
);

router.post(
    '/orders/:id/assign',
    validate(assignAgentSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const booking = await merchantService.assignAgent(userId, String(req.params.id), req.body);
        res.json({ booking });
    }),
);

// ─── AGENTS ───

router.get(
    '/agents',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const agents = await merchantService.listAgents(id);
        res.json({ agents });
    }),
);

router.post(
    '/agents',
    validate(createAgentSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const agent = await merchantService.createAgent(id, req.body);
        res.status(201).json({ agent });
    }),
);

router.put(
    '/agents/:id',
    validate(updateAgentSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const agent = await merchantService.updateAgent(userId, String(req.params.id), req.body);
        res.json({ agent });
    }),
);

// ─── AGENT LIVE TRACKING (Phase 6) ───

router.get(
    '/agents/live',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const agents = await merchantService.getAgentLiveLocations(id);
        res.json({ agents });
    }),
);

router.get(
    '/agents/status-grid',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const agents = await merchantService.getAgentStatusGrid(id);
        res.json({ agents });
    }),
);

// Mock endpoint to simulate an agent device sending its GPS (for testing)
router.post(
    '/agents/mock-location',
    asyncHandler(async (req: Request, res: Response) => {
        const { userId, lat, lng } = req.body;
        const agent = await merchantService.updateAgentLocation(userId, Number(lat), Number(lng));
        res.json({ agent });
    }),
);

// ─── SLOTS ───

router.get(
    '/slots',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const { date } = req.query;
        const slots = await merchantService.listSlots(id, date as string | undefined);
        res.json({ slots });
    }),
);

router.post(
    '/slots/bulk',
    validate(createSlotsSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const result = await merchantService.createSlots(id, req.body);
        res.status(201).json({ created: result.count });
    }),
);

// ─── EARNINGS ───

router.get(
    '/earnings',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const { period, page, limit } = req.query;
        const result = await merchantService.getEarnings(id, {
            period: (period as 'day' | 'week' | 'month') || 'month',
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
        res.json(result);
    }),
);

// ─── KYC ───

router.post(
    '/kyc',
    validate(submitKycDocSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const doc = await merchantService.submitKycDoc(id, req.body);
        res.status(201).json({ document: doc });
    }),
);

// ─── PROMOTIONS ───

router.get(
    '/promotions',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const promotions = await merchantService.listPromotions(id);
        res.json({ promotions });
    }),
);

router.post(
    '/promotions',
    validate(createPromotionSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const promotion = await merchantService.createPromotion(id, req.body);
        res.status(201).json({ promotion });
    }),
);

router.put(
    '/promotions/:id',
    validate(updatePromotionSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const promotion = await merchantService.updatePromotion(userId, String(req.params.id), req.body);
        res.json({ promotion });
    }),
);

// ─── ANALYTICS ───

router.get(
    '/analytics',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const periodDays = req.query.days ? parseInt(String(req.query.days), 10) : 30;
        const analytics = await merchantService.getAnalytics(id, periodDays);
        res.json({ analytics });
    }),
);

// ─── SETTINGS ───

router.get(
    '/settings',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const settings = await merchantService.getSettings(id);
        res.json({ settings });
    }),
);

router.put(
    '/settings',
    validate(updateMerchantProfileSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const settings = await merchantService.updateSettings(id, req.body);
        res.json({ settings });
    }),
);

// ─── REVIEWS ───

router.get(
    '/reviews',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const { page, limit } = req.query;
        const result = await merchantService.listReviews(id, {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
        res.json(result);
    }),
);

router.post(
    '/reviews/:id/reply',
    validate(replyToReviewSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const review = await merchantService.replyToReview(userId, String(req.params.id), req.body.reply);
        res.json({ review });
    }),
);

// ─── CHAT ───

router.get(
    '/chat',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const chats = await merchantService.listChats(id);
        res.json({ chats });
    }),
);

router.post(
    '/chat/open/:bookingId',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const chat = await merchantService.getOrCreateChat(id, String(req.params.bookingId), 'MERCHANT');
        res.json({ chat });
    }),
);

router.get(
    '/chat/:chatId/messages',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const { page, limit } = req.query;
        const result = await merchantService.getChatMessages(id, String(req.params.chatId), {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
        res.json(result);
    }),
);

router.post(
    '/chat/:chatId/messages',
    validate(sendMessageSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const message = await merchantService.sendChatMessage(id, String(req.params.chatId), req.body.content);
        res.status(201).json({ message });
    }),
);

// ─── NOTIFICATIONS ───

router.get(
    '/notifications',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const { unreadOnly, page, limit } = req.query;
        const result = await merchantService.listNotifications(id, {
            unreadOnly: unreadOnly === 'true',
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
        res.json(result);
    }),
);

router.patch(
    '/notifications/:id/read',
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const notification = await merchantService.markNotificationRead(userId, String(req.params.id));
        res.json({ notification });
    }),
);

router.post(
    '/notifications/read-all',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        await merchantService.markAllNotificationsRead(id);
        res.json({ success: true, message: 'All notifications marked as read' });
    }),
);

// ─── PUSH NOTIFICATIONS ───

router.post(
    '/push-token',
    validate(updatePushTokenSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const { token } = req.body;
        await merchantService.updatePushToken(id, token);
        res.json({ success: true, message: 'Push token updated' });
    }),
);

export default router;
