import { Router, Request, Response } from 'express';
import { authenticate, requireRoles } from '../middleware/auth';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';
import prisma from '../lib/prisma';
import { BadRequestError } from '../middleware/error-handler';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, requireRoles('ADMIN'));

// ─── MERCHANT VERIFICATION (KYC) ───

/**
 * GET /api/v1/admin/merchants/pending
 * List merchants pending KYC verification
 */
router.get(
    '/merchants/pending',
    asyncHandler(async (_req: Request, res: Response) => {
        const merchants = await prisma.merchantProfile.findMany({
            where: {
                verificationStatus: { in: ['PENDING_REVIEW'] },
            },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
                verificationDocs: { orderBy: { createdAt: 'desc' } },
            },
            orderBy: { updatedAt: 'desc' },
        });
        sendSuccess(res, { merchants });
    }),
);

/**
 * PATCH /api/v1/admin/merchants/:merchantProfileId/verify
 * Approve a merchant — sets isVerified = true, verificationStatus = VERIFIED
 */
router.patch(
    '/merchants/:merchantProfileId/verify',
    asyncHandler(async (req: Request, res: Response) => {
        const { merchantProfileId } = req.params;

        const profile = await prisma.merchantProfile.findUnique({
            where: { id: merchantProfileId },
        });
        if (!profile) throw new BadRequestError('Merchant profile not found');

        const updated = await prisma.merchantProfile.update({
            where: { id: merchantProfileId },
            data: {
                isVerified: true,
                verificationStatus: 'APPROVED',
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        // Notify the merchant
        await prisma.notification.create({
            data: {
                userId: profile.userId,
                type: 'SYSTEM',
                title: 'Business Verified! 🎉',
                body: 'Your business has been verified. Customers can now discover your services.',
            },
        });

        sendSuccess(res, { merchant: updated }, 'Merchant verified successfully');
    }),
);

/**
 * PATCH /api/v1/admin/merchants/:merchantProfileId/reject
 * Reject a merchant's KYC — sets verificationStatus = REJECTED
 */
router.patch(
    '/merchants/:merchantProfileId/reject',
    asyncHandler(async (req: Request, res: Response) => {
        const { merchantProfileId } = req.params;
        const { reason } = req.body;

        const profile = await prisma.merchantProfile.findUnique({
            where: { id: merchantProfileId },
        });
        if (!profile) throw new BadRequestError('Merchant profile not found');

        const updated = await prisma.merchantProfile.update({
            where: { id: merchantProfileId },
            data: {
                isVerified: false,
                verificationStatus: 'REJECTED',
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        await prisma.notification.create({
            data: {
                userId: profile.userId,
                type: 'SYSTEM',
                title: 'Verification Update',
                body: reason || 'Your verification was not approved. Please re-submit your documents.',
            },
        });

        sendSuccess(res, { merchant: updated }, 'Merchant verification rejected');
    }),
);

/**
 * GET /api/v1/admin/merchants
 * List all merchants (admin overview)
 */
router.get(
    '/merchants',
    asyncHandler(async (_req: Request, res: Response) => {
        const merchants = await prisma.merchantProfile.findMany({
            include: {
                user: { select: { id: true, name: true, email: true, phone: true, status: true } },
                _count: { select: { merchantServices: true, agents: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        sendSuccess(res, { merchants });
    }),
);

export default router;
