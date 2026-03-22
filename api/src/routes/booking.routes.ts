import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
    createBookingSchema,
    updateBookingStatusSchema,
    createReviewSchema,
    createAddressSchema,
    updateAddressSchema,
} from '../validators/marketplace.validators';
import { asyncHandler } from '../utils/async-handler';
import * as bookingController from '../controllers/booking.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ─── ADDRESSES ───
router.get('/addresses', asyncHandler(bookingController.listAddresses));
router.post('/addresses', validate(createAddressSchema), asyncHandler(bookingController.createAddress));
router.put('/addresses/:id', validate(updateAddressSchema), asyncHandler(bookingController.updateAddress));
router.delete('/addresses/:id', asyncHandler(bookingController.deleteAddress));

// ─── BOOKINGS ───
router.post('/', validate(createBookingSchema), asyncHandler(bookingController.createBooking));
router.get('/', asyncHandler(bookingController.listBookings));
router.get('/:id', asyncHandler(bookingController.getBookingById));
router.patch('/:id/status', validate(updateBookingStatusSchema), asyncHandler(bookingController.updateBookingStatus));

// ─── REVIEWS ───
router.post('/reviews', validate(createReviewSchema), asyncHandler(bookingController.createReview));

export default router;
