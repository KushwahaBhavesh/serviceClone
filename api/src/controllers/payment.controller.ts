import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import * as paymentService from '../services/payment.service';

export async function initiatePayment(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const result = await paymentService.initiatePayment(id, req.body);
    sendSuccess(res, result);
}

export async function confirmPayment(req: Request, res: Response) {
    const result = await paymentService.confirmPayment(req.body);
    sendSuccess(res, result, 'Payment confirmed');
}

export async function processRefund(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const { bookingId, reason } = req.body;
    const result = await paymentService.processRefund(id, bookingId, reason);
    sendSuccess(res, result);
}

export async function listPaymentMethods(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const result = await paymentService.listPaymentMethods(id);
    sendSuccess(res, result);
}
