import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth';
import { asyncHandler } from '../utils/async-handler';
import * as ac from '../controllers/agent.controller';

const router = Router();

// All agent routes require authentication + AGENT role
router.use(authenticate, requireRoles('AGENT'));

// ─── DASHBOARD ───
router.get('/dashboard', asyncHandler(ac.getDashboard));

// ─── JOBS ───
router.get('/jobs', asyncHandler(ac.getJobs));
router.get('/jobs/:id', asyncHandler(ac.getJobDetails));
router.patch('/jobs/:id/status', asyncHandler(ac.updateJobStatus));
router.get('/history', asyncHandler(ac.getJobHistory));

// ─── AVAILABILITY & LOCATION ───
router.put('/availability', asyncHandler(ac.updateAvailability));
router.post('/location', asyncHandler(ac.updateLocation));

// ─── CHAT ───
router.post('/chat/open/:bookingId', asyncHandler(ac.openChat));
router.get('/chat/:chatId/messages', asyncHandler(ac.getChatMessages));
router.post('/chat/:chatId/messages', asyncHandler(ac.sendChatMessage));

// ─── NOTIFICATIONS ───
router.get('/notifications', asyncHandler(ac.listNotifications));
router.patch('/notifications/:id/read', asyncHandler(ac.markNotificationRead));
router.post('/notifications/read-all', asyncHandler(ac.markAllNotificationsRead));
router.post('/push-token', asyncHandler(ac.updatePushToken));

export default router;
