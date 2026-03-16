import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
    createBookingSchema,
    updateBookingStatusSchema,
    createReviewSchema,
    createAddressSchema,
    updateAddressSchema,
} from '../validators/marketplace.validators';
import * as bookingService from '../services/booking.service';
import * as customerService from '../services/customer.service';

const router = Router();

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

// All routes require authentication
router.use(authenticate);

// ─── ADDRESSES ───

// GET /api/v1/bookings/addresses
router.get(
    '/addresses',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const addresses = await customerService.listAddresses(id);
        res.json({ addresses });
    }),
);

// POST /api/v1/bookings/addresses
router.post(
    '/addresses',
    validate(createAddressSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const address = await customerService.createAddress(id, req.body);
        res.status(201).json({ address });
    }),
);

// PUT /api/v1/bookings/addresses/:id
router.put(
    '/addresses/:id',
    validate(updateAddressSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const address = await customerService.updateAddress(userId, String(req.params.id), req.body);
        res.json({ address });
    }),
);

// DELETE /api/v1/bookings/addresses/:id
router.delete(
    '/addresses/:id',
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        await customerService.deleteAddress(userId, String(req.params.id));
        res.json({ message: 'Address deleted' });
    }),
);

// ─── BOOKINGS ───

// POST /api/v1/bookings
router.post(
    '/',
    validate(createBookingSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const booking = await bookingService.createBooking(id, req.body);
        res.status(201).json({ booking });
    }),
);

// GET /api/v1/bookings
router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        const { id, role } = (req as AuthenticatedRequest).user;
        const { status, page, limit } = req.query;
        const result = await bookingService.listBookings(
            id,
            role === 'MERCHANT' ? 'merchant' : 'customer',
            {
                status: (status as string | undefined) as 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | undefined,
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
            },
        );
        res.json(result);
    }),
);

// GET /api/v1/bookings/:id
router.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const booking = await bookingService.getBookingById(String(req.params.id), userId);
        res.json({ booking });
    }),
);

// PATCH /api/v1/bookings/:id/status
router.patch(
    '/:id/status',
    validate(updateBookingStatusSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: userId } = (req as AuthenticatedRequest).user;
        const booking = await bookingService.updateBookingStatus(
            String(req.params.id), userId, req.body,
        );
        res.json({ booking });
    }),
);

// ─── REVIEWS ───

// POST /api/v1/bookings/reviews
router.post(
    '/reviews',
    validate(createReviewSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const review = await bookingService.createReview(id, req.body);
        res.status(201).json({ review });
    }),
);

export default router;
