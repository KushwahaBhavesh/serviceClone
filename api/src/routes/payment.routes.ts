import { Router, raw } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/async-handler';
import * as pc from '../controllers/payment.controller';

const router = Router();

// ─── WEBHOOK (no auth, raw body for signature verification) ───
router.post('/webhook', raw({ type: 'application/json' }), asyncHandler(pc.handleWebhook));

// All remaining routes require authentication
router.use(authenticate);

// ─── PAYMENTS ───
router.post('/initiate', asyncHandler(pc.initiatePayment));
router.post('/confirm', asyncHandler(pc.confirmPayment));
router.post('/refund', asyncHandler(pc.processRefund));
router.get('/methods', asyncHandler(pc.listPaymentMethods));

// ─── WALLET TOP-UP ───
router.post('/wallet/topup', asyncHandler(pc.walletTopup));
router.post('/wallet/confirm', asyncHandler(pc.walletConfirm));

export default router;
