import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendCreated } from '../utils/response';
import * as bookingService from '../services/booking.service';
import * as customerService from '../services/customer.service';
import * as pushTemplates from '../utils/pushTemplates';

// ─── ADDRESSES ───

export async function listAddresses(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const addresses = await customerService.listAddresses(id);
    sendSuccess(res, { addresses });
}

export async function createAddress(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const address = await customerService.createAddress(id, req.body);
    sendCreated(res, { address });
}

export async function updateAddress(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const address = await customerService.updateAddress(userId, String(req.params.id), req.body);
    sendSuccess(res, { address });
}

export async function deleteAddress(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    await customerService.deleteAddress(userId, String(req.params.id));
    sendSuccess(res, null, 'Address deleted');
}

// ─── BOOKINGS ───

export async function createBooking(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const booking = await bookingService.createBooking(id, req.body);
    sendCreated(res, { booking });

    // Fire-and-forget push
    try {
        const serviceName = (booking as any).items?.[0]?.service?.name || 'Service';
        pushTemplates.bookingCreated(id, booking.id, serviceName).catch(() => { });
    } catch { }
}

export async function listBookings(req: Request, res: Response) {
    const { id, role } = (req as AuthenticatedRequest).user;
    const { status, page, limit } = req.query;
    const result = await bookingService.listBookings(
        id,
        role === 'MERCHANT' ? 'merchant' : 'customer',
        {
            status: status as any,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        },
    );
    sendSuccess(res, result);
}

export async function getBookingById(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const booking = await bookingService.getBookingById(String(req.params.id), userId);
    sendSuccess(res, { booking });
}

export async function updateBookingStatus(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const booking = await bookingService.updateBookingStatus(String(req.params.id), userId, req.body);
    sendSuccess(res, { booking });

    // Fire-and-forget push
    try {
        const customerId = (booking as any).customerId || (booking as any).userId;
        if (customerId && req.body.status) {
            pushTemplates.jobStatusChanged(customerId, req.body.status, booking.id).catch(() => { });
        }
    } catch { }
}

// ─── REVIEWS ───

export async function createReview(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const review = await bookingService.createReview(id, req.body);
    sendCreated(res, { review });
}
