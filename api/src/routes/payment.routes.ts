import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/async-handler';
import * as pc from '../controllers/payment.controller';

const router = Router();

// All routes require authentication (except webhook — add later)
router.use(authenticate);

// ─── PAYMENTS ───
router.post('/initiate', asyncHandler(pc.initiatePayment));
router.post('/confirm', asyncHandler(pc.confirmPayment));
router.post('/refund', asyncHandler(pc.processRefund));
router.get('/methods', asyncHandler(pc.listPaymentMethods));

export default router;
