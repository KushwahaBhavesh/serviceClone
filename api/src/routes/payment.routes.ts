import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import * as paymentService from '../services/payment.service';

const router = Router();

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

// All routes require authentication (except webhook)
router.use(authenticate);

// ─── Payment Intent ───

// POST /api/v1/payments/initiate
router.post(
    '/initiate',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const result = await paymentService.initiatePayment(id, req.body);
        res.json(result);
    }),
);

// POST /api/v1/payments/confirm
router.post(
    '/confirm',
    asyncHandler(async (req: Request, res: Response) => {
        const result = await paymentService.confirmPayment(req.body);
        res.json(result);
    }),
);

// ─── Refund ───

// POST /api/v1/payments/refund
router.post(
    '/refund',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const { bookingId, reason } = req.body;
        const result = await paymentService.processRefund(id, bookingId, reason);
        res.json(result);
    }),
);

// ─── Payment Methods ───

// GET /api/v1/payments/methods
router.get(
    '/methods',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const result = await paymentService.listPaymentMethods(id);
        res.json(result);
    }),
);

export default router;
