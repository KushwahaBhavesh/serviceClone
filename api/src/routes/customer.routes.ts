import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
    addressSchema,
    updateAddressSchema,
    topupSchema,
} from '../validators/customer.validators';
import { sendMessageSchema } from '../validators/merchant.validators';
import { asyncHandler } from '../utils/async-handler';
import * as cc from '../controllers/customer.controller';

const router = Router();

// ─── ADDRESSES ───
router.get('/addresses', authenticate, asyncHandler(cc.listAddresses as any));
router.post('/addresses', authenticate, validate(addressSchema), asyncHandler(cc.createAddress as any));
router.put('/addresses/:id', authenticate, validate(updateAddressSchema), asyncHandler(cc.updateAddress as any));
router.delete('/addresses/:id', authenticate, asyncHandler(cc.deleteAddress as any));

// ─── WALLET ───
router.get('/wallet', authenticate, asyncHandler(cc.getWallet as any));
router.post('/wallet/topup', authenticate, validate(topupSchema), asyncHandler(cc.topupWallet as any));

// ─── ENGAGEMENT ───
router.get('/reviews', authenticate, asyncHandler(cc.listReviews as any));
router.get('/notifications', authenticate, asyncHandler(cc.listNotifications as any));
router.post('/notifications/read-all', authenticate, asyncHandler(cc.markAllNotificationsRead as any));
router.get('/chats', authenticate, asyncHandler(cc.listChats as any));
router.post('/chats/open/:bookingId', authenticate, asyncHandler(cc.openChat as any));
router.get('/chats/:chatId/messages', authenticate, asyncHandler(cc.getChatMessages as any));
router.post('/chats/:chatId/messages', authenticate, validate(sendMessageSchema), asyncHandler(cc.sendChatMessage as any));

export default router;
