import prisma from '../lib/prisma';
import { BadRequestError } from '../middleware/error-handler';
import crypto from 'crypto';

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

    // For RAZORPAY / UPI / CARD — create a payment order (placeholder for gateway SDK)
    const orderId = `pay_${crypto.randomBytes(12).toString('hex')}`;

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
        orderId,
        transactionId: transaction.id,
        // In production, this would be Razorpay order_id or Stripe payment_intent
        gatewayConfig: {
            key: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
            amount: Math.round(booking.total * 100), // paise
            currency: 'INR',
            name: 'Home Service',
            description: `Booking #${booking.bookingNumber}`,
            orderId,
        },
    };
}

// ─── Payment Webhook / Confirmation ───

export async function confirmPayment(data: {
    transactionId: string;
    gatewayPaymentId: string;
    gatewaySignature?: string;
}) {
    const transaction = await prisma.walletTransaction.findUnique({
        where: { id: data.transactionId },
    });
    if (!transaction) throw new BadRequestError('Transaction not found');
    if (transaction.status !== 'PENDING') throw new BadRequestError('Transaction already processed');

    // In production: verify Razorpay signature here
    // const isValid = razorpay.validateWebhookSignature(...)
    // if (!isValid) throw new BadRequestError('Invalid payment signature');

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

// ─── Payment Methods (Saved Cards / UPI) ───

export async function listPaymentMethods(userId: string) {
    // In production, this would query Razorpay/Stripe for saved tokens
    // For now, return wallet info + placeholder methods
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
    });

    return {
        wallet: { balance: user?.walletBalance || 0 },
        savedMethods: [
            // Placeholder — in production, fetched from payment gateway
        ],
        available: ['WALLET', 'RAZORPAY', 'UPI', 'CARD'],
    };
}
