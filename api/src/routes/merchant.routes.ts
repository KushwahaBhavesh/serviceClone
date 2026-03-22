import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth';
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
import { asyncHandler } from '../utils/async-handler';
import * as mc from '../controllers/merchant.controller';

const router = Router();

// All routes require authentication + MERCHANT role
router.use(authenticate, requireRoles('MERCHANT'));

// ─── DASHBOARD ───
router.get('/dashboard', asyncHandler(mc.getDashboard));

// ─── SERVICE CATALOG ───
router.get('/services', asyncHandler(mc.listServices));
router.post('/services', validate(createMerchantServiceSchema), asyncHandler(mc.enableService));
router.put('/services/:id', validate(updateMerchantServiceSchema), asyncHandler(mc.updateService));
router.delete('/services/:id', asyncHandler(mc.disableService));
router.post('/services/custom', asyncHandler(mc.createCustomService));

// ─── ORDERS ───
router.get('/orders', asyncHandler(mc.listOrders));
router.get('/orders/:id', asyncHandler(mc.getOrder));
router.patch('/orders/:id/accept', asyncHandler(mc.acceptOrder));
router.patch('/orders/:id/reject', asyncHandler(mc.rejectOrder));
router.post('/orders/:id/assign', validate(assignAgentSchema), asyncHandler(mc.assignAgent));

// ─── AGENTS ───
router.get('/agents', asyncHandler(mc.listAgents));
router.post('/agents', validate(createAgentSchema), asyncHandler(mc.createAgent));
router.put('/agents/:id', validate(updateAgentSchema), asyncHandler(mc.updateAgent));
router.get('/agents/live', asyncHandler(mc.getAgentLiveLocations));
router.get('/agents/status-grid', asyncHandler(mc.getAgentStatusGrid));
router.post('/agents/mock-location', asyncHandler(mc.mockAgentLocation));

// ─── SLOTS ───
router.get('/slots', asyncHandler(mc.listSlots));
router.post('/slots/bulk', validate(createSlotsSchema), asyncHandler(mc.createSlots));

// ─── EARNINGS ───
router.get('/earnings', asyncHandler(mc.getEarnings));

// ─── KYC ───
router.post('/kyc', validate(submitKycDocSchema), asyncHandler(mc.submitKycDoc));

// ─── PROMOTIONS ───
router.get('/promotions', asyncHandler(mc.listPromotions));
router.post('/promotions', validate(createPromotionSchema), asyncHandler(mc.createPromotion));
router.put('/promotions/:id', validate(updatePromotionSchema), asyncHandler(mc.updatePromotion));

// ─── ANALYTICS ───
router.get('/analytics', asyncHandler(mc.getAnalytics));

// ─── SETTINGS ───
router.get('/settings', asyncHandler(mc.getSettings));
router.put('/settings', validate(updateMerchantProfileSchema), asyncHandler(mc.updateSettings));

// ─── REVIEWS ───
router.get('/reviews', asyncHandler(mc.listReviews));
router.post('/reviews/:id/reply', validate(replyToReviewSchema), asyncHandler(mc.replyToReview));

// ─── CHAT ───
router.get('/chat', asyncHandler(mc.listChats));
router.post('/chat/open/:bookingId', asyncHandler(mc.openChat));
router.get('/chat/:chatId/messages', asyncHandler(mc.getChatMessages));
router.post('/chat/:chatId/messages', validate(sendMessageSchema), asyncHandler(mc.sendChatMessage));

// ─── NOTIFICATIONS ───
router.get('/notifications', asyncHandler(mc.listNotifications));
router.patch('/notifications/:id/read', asyncHandler(mc.markNotificationRead));
router.post('/notifications/read-all', asyncHandler(mc.markAllNotificationsRead));
router.post('/push-token', validate(updatePushTokenSchema), asyncHandler(mc.updatePushToken));

export default router;
