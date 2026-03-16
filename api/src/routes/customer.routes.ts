import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
    addressSchema,
    updateAddressSchema,
    topupSchema,
} from '../validators/customer.validators';
import { sendMessageSchema } from '../validators/merchant.validators';
import * as customerService from '../services/customer.service';
import * as chatService from '../services/chat.service';

const router = Router();

// Async wrapper helper
const asyncHandler = (fn: (req: any, res: Response, next: NextFunction) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);

// ─── ADDRESSES ───

// GET /api/v1/customer/addresses
router.get(
    '/addresses',
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const result = await customerService.listAddresses(req.user.id);
        res.json({ addresses: result });
    }),
);

// POST /api/v1/customer/addresses
router.post(
    '/addresses',
    authenticate,
    validate(addressSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const result = await customerService.createAddress(req.user.id, req.body);
        res.status(201).json({ address: result });
    }),
);

// PUT /api/v1/customer/addresses/:id
router.put(
    '/addresses/:id',
    authenticate,
    validate(updateAddressSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const result = await customerService.updateAddress(req.user.id, String(req.params.id), req.body);
        res.json({ address: result });
    }),
);

// DELETE /api/v1/customer/addresses/:id
router.delete(
    '/addresses/:id',
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        await customerService.deleteAddress(req.user.id, String(req.params.id));
        res.status(204).send();
    }),
);

// ─── WALLET ───

// GET /api/v1/customer/wallet
router.get(
    '/wallet',
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const result = await customerService.getWalletData(req.user.id);
        res.json(result);
    }),
);

// POST /api/v1/customer/wallet/topup
router.post(
    '/wallet/topup',
    authenticate,
    validate(topupSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const result = await customerService.topupWallet(req.user.id, req.body);
        res.json(result);
    }),
);

// ─── ENGAGEMENT ───

// GET /api/v1/customer/reviews
router.get(
    '/reviews',
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const result = await customerService.listMyReviews(req.user.id);
        res.json({ reviews: result });
    }),
);

// GET /api/v1/customer/notifications
router.get(
    '/notifications',
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const result = await customerService.listMyNotifications(req.user.id);
        res.json(result);
    }),
);

// POST /api/v1/customer/notifications/read-all
router.post(
    '/notifications/read-all',
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        await customerService.markAllNotificationsRead(req.user.id);
        res.json({ success: true });
    }),
);

// GET /api/v1/customer/chats
router.get(
    '/chats',
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const result = await customerService.listMyChats(req.user.id);
        res.json({ chats: result });
    }),
);

// POST /api/v1/customer/chats/open/:bookingId
router.post(
    '/chats/open/:bookingId',
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const chat = await chatService.getOrCreateChat(req.user.id, String(req.params.bookingId), 'CUSTOMER');
        res.json({ chat });
    }),
);

// GET /api/v1/customer/chats/:chatId/messages
router.get(
    '/chats/:chatId/messages',
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const { page, limit } = req.query;
        const result = await chatService.getChatMessages(req.user.id, String(req.params.chatId), {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
        res.json(result);
    }),
);

// POST /api/v1/customer/chats/:chatId/messages
router.post(
    '/chats/:chatId/messages',
    authenticate,
    validate(sendMessageSchema),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const message = await chatService.sendChatMessage(req.user.id, String(req.params.chatId), req.body.content);
        res.status(201).json({ message });
    }),
);

export default router;
