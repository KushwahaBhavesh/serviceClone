import prisma from '../lib/prisma';
import { BadRequestError } from '../middleware/error-handler';
import crypto from 'crypto';
import Razorpay from 'razorpay';

// ─── Razorpay Singleton ───

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

const CURRENCY = process.env.PAYMENT_CURRENCY || 'INR';

// ─── Signature Verification ───

function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    return expectedSignature === signature;
}

function verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
    return expectedSignature === signature;
}

// ─── Payment Intent ───

export async function initiatePayment(userId: string, data: {
    bookingId: string;
    method: 'WALLET' | 'RAZORPAY' | 'UPI' | 'CARD';
}) {
    const booking = await prisma.booking.findFirst({
        where: { id: data.bookingId, customerId: userId },
    });
    if (!booking) throw new BadRequestError('Booking not found');
    if (booking.paymentStatus === 'PAID') throw new BadRequestError('Booking already paid');

    // For WALLET payments, deduct immediately
    if (data.method === 'WALLET') {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.walletBalance < booking.total) {
            throw new BadRequestError('Insufficient wallet balance');
        }

        const [updatedUser, transaction, updatedBooking] = await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { walletBalance: { decrement: booking.total } },
            }),
            prisma.walletTransaction.create({
                data: {
                    userId,
                    amount: booking.total,
                    type: 'PAYMENT',
                    status: 'COMPLETED',
                    description: `Payment for booking #${booking.bookingNumber}`,
                    referenceId: booking.id,
                },
            }),
            prisma.booking.update({
                where: { id: booking.id },
                data: { paymentStatus: 'PAID' },
            }),
        ]);

        return {
            status: 'COMPLETED',
            method: 'WALLET',
            amount: booking.total,
            transactionId: transaction.id,
            newBalance: updatedUser.walletBalance,
        };
    }

    // For RAZORPAY / UPI / CARD — create a real Razorpay order
    const amountInPaise = Math.round(booking.total * 100);

    const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: CURRENCY,
        receipt: `booking_${booking.bookingNumber}`,
        notes: {
            bookingId: booking.id,
            userId,
            bookingNumber: booking.bookingNumber,
        },
    });

    // Create a pending wallet transaction as a payment record
    const transaction = await prisma.walletTransaction.create({
        data: {
            userId,
            amount: booking.total,
            type: 'PAYMENT',
            status: 'PENDING',
            description: `Payment for booking #${booking.bookingNumber}`,
            referenceId: booking.id,
        },
    });

    return {
        status: 'PENDING',
        method: data.method,
        amount: booking.total,
        orderId: razorpayOrder.id,
        transactionId: transaction.id,
        gatewayConfig: {
            key: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
            amount: amountInPaise,
            currency: CURRENCY,
            name: 'ServiceClone',
            description: `Booking #${booking.bookingNumber}`,
            orderId: razorpayOrder.id,
        },
    };
}

// ─── Payment Confirmation ───

export async function confirmPayment(data: {
    transactionId: string;
    gatewayPaymentId: string;
    gatewayOrderId: string;
    gatewaySignature: string;
}) {
    const transaction = await prisma.walletTransaction.findUnique({
        where: { id: data.transactionId },
    });
    if (!transaction) throw new BadRequestError('Transaction not found');
    if (transaction.status !== 'PENDING') throw new BadRequestError('Transaction already processed');

    // Verify Razorpay signature
    const isValid = verifyRazorpaySignature(
        data.gatewayOrderId,
        data.gatewayPaymentId,
        data.gatewaySignature
    );
    if (!isValid) throw new BadRequestError('Invalid payment signature');

    const [updatedTx, updatedBooking] = await prisma.$transaction([
        prisma.walletTransaction.update({
            where: { id: transaction.id },
            data: { status: 'COMPLETED' },
        }),
        prisma.booking.update({
            where: { id: transaction.referenceId! },
            data: { paymentStatus: 'PAID' },
        }),
    ]);

    return { status: 'COMPLETED', transactionId: updatedTx.id };
}

// ─── Webhook Handler ───

export async function handleWebhook(rawBody: string | Buffer, signature: string) {
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) throw new BadRequestError('Invalid webhook signature');

    const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString());
    const event = payload.event;
    const entity = payload.payload?.payment?.entity;

    if (!entity) return { status: 'ignored', event };

    const orderId = entity.order_id;
    const paymentId = entity.id;

    // Idempotency: find the pending transaction by matching orderId in description
    // We look up the booking from the Razorpay order notes
    const notes = entity.notes || {};
    const bookingId = notes.bookingId;

    if (!bookingId) return { status: 'ignored', reason: 'no bookingId in notes' };

    switch (event) {
        case 'payment.captured': {
            // Mark booking as PAID
            const tx = await prisma.walletTransaction.findFirst({
                where: { referenceId: bookingId, status: 'PENDING', type: 'PAYMENT' },
            });
            if (!tx) return { status: 'ignored', reason: 'no pending transaction' };

            await prisma.$transaction([
                prisma.walletTransaction.update({
                    where: { id: tx.id },
                    data: { status: 'COMPLETED' },
                }),
                prisma.booking.update({
                    where: { id: bookingId },
                    data: { paymentStatus: 'PAID' },
                }),
            ]);
            return { status: 'processed', event, bookingId };
        }

        case 'payment.failed': {
            const tx = await prisma.walletTransaction.findFirst({
                where: { referenceId: bookingId, status: 'PENDING', type: 'PAYMENT' },
            });
            if (!tx) return { status: 'ignored', reason: 'no pending transaction' };

            await prisma.walletTransaction.update({
                where: { id: tx.id },
                data: { status: 'FAILED' },
            });
            return { status: 'processed', event, bookingId };
        }

        case 'refund.processed': {
            // Update refund status if applicable
            return { status: 'processed', event, bookingId };
        }

        default:
            return { status: 'ignored', event };
    }
}

// ─── Refund ───

export async function processRefund(userId: string, bookingId: string, reason?: string) {
    const booking = await prisma.booking.findFirst({
        where: { id: bookingId, customerId: userId },
    });
    if (!booking) throw new BadRequestError('Booking not found');
    if (booking.paymentStatus !== 'PAID') throw new BadRequestError('Booking is not paid');
    if (!['CANCELLED', 'REJECTED'].includes(booking.status)) {
        throw new BadRequestError('Booking must be cancelled or rejected for refund');
    }

    // Refund to wallet (instant) regardless of original payment method
    const [updatedUser, refundTx, updatedBooking] = await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { walletBalance: { increment: booking.total } },
        }),
        prisma.walletTransaction.create({
            data: {
                userId,
                amount: booking.total,
                type: 'REFUND',
                status: 'COMPLETED',
                description: reason || `Refund for booking #${booking.bookingNumber}`,
                referenceId: booking.id,
            },
        }),
        prisma.booking.update({
            where: { id: booking.id },
            data: { paymentStatus: 'REFUNDED' },
        }),
    ]);

    return {
        status: 'REFUNDED',
        amount: booking.total,
        newBalance: updatedUser.walletBalance,
        transactionId: refundTx.id,
    };
}

// ─── Wallet Top-Up ───

export async function walletTopup(userId: string, amount: number) {
    if (amount < 100) throw new BadRequestError('Minimum top-up amount is ₹100');

    const amountInPaise = Math.round(amount * 100);

    const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: CURRENCY,
        receipt: `wallet_topup_${userId}_${Date.now()}`,
        notes: { userId, type: 'WALLET_TOPUP' },
    });

    // Create a pending topup transaction
    const transaction = await prisma.walletTransaction.create({
        data: {
            userId,
            amount,
            type: 'TOPUP',
            status: 'PENDING',
            description: `Wallet top-up of ₹${amount}`,
            referenceId: razorpayOrder.id,
        },
    });

    return {
        status: 'PENDING',
        orderId: razorpayOrder.id,
        transactionId: transaction.id,
        gatewayConfig: {
            key: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
            amount: amountInPaise,
            currency: CURRENCY,
            name: 'ServiceClone',
            description: `Wallet Top-up ₹${amount}`,
            orderId: razorpayOrder.id,
        },
    };
}

export async function walletConfirm(userId: string, data: {
    transactionId: string;
    gatewayPaymentId: string;
    gatewayOrderId: string;
    gatewaySignature: string;
}) {
    const transaction = await prisma.walletTransaction.findUnique({
        where: { id: data.transactionId },
    });
    if (!transaction) throw new BadRequestError('Transaction not found');
    if (transaction.userId !== userId) throw new BadRequestError('Unauthorized');
    if (transaction.status !== 'PENDING') throw new BadRequestError('Transaction already processed');

    // Verify Razorpay signature
    const isValid = verifyRazorpaySignature(
        data.gatewayOrderId,
        data.gatewayPaymentId,
        data.gatewaySignature
    );
    if (!isValid) throw new BadRequestError('Invalid payment signature');

    const [updatedUser, updatedTx] = await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { walletBalance: { increment: transaction.amount } },
        }),
        prisma.walletTransaction.update({
            where: { id: transaction.id },
            data: { status: 'COMPLETED' },
        }),
    ]);

    return {
        status: 'COMPLETED',
        transactionId: updatedTx.id,
        amount: transaction.amount,
        newBalance: updatedUser.walletBalance,
    };
}

// ─── Payment Methods (Saved Cards / UPI) ───

export async function listPaymentMethods(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
    });

    return {
        wallet: { balance: user?.walletBalance || 0 },
        savedMethods: [],
        available: ['WALLET', 'RAZORPAY', 'UPI', 'CARD'],
    };
}
