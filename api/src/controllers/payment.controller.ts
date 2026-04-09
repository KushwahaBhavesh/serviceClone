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
    const { transactionId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const result = await paymentService.confirmPayment({
        transactionId,
        gatewayPaymentId: razorpay_payment_id,
        gatewayOrderId: razorpay_order_id,
        gatewaySignature: razorpay_signature,
    });
    sendSuccess(res, result, 'Payment confirmed');
}

export async function handleWebhook(req: Request, res: Response) {
    try {
        const signature = req.headers['x-razorpay-signature'] as string;
        const rawBody = (req as any).rawBody || req.body;
        const result = await paymentService.handleWebhook(rawBody, signature);
        sendSuccess(res, result);
    } catch (err: any) {
        // Webhooks should always return 200 to avoid retries for validation errors
        console.error('Webhook processing error:', err.message);
        res.status(200).json({ status: 'error', message: err.message });
    }
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

export async function walletTopup(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const { amount } = req.body;
    const result = await paymentService.walletTopup(id, amount);
    sendSuccess(res, result);
}

export async function walletConfirm(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const { transactionId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const result = await paymentService.walletConfirm(id, {
        transactionId,
        gatewayPaymentId: razorpay_payment_id,
        gatewayOrderId: razorpay_order_id,
        gatewaySignature: razorpay_signature,
    });
    sendSuccess(res, result);
}
