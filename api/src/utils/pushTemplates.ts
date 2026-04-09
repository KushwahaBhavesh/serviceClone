import { createNotification } from '../services/push.service';
import logger from './logger';

/**
 * Push notification templates — all fire-and-forget.
 * Each stores a Notification record in DB and sends an Expo push.
 */

// ─── Booking Events ───

export async function bookingCreated(customerId: string, bookingId: string, serviceName: string) {
    try {
        await createNotification(
            customerId,
            'BOOKING_CREATED',
            'Booking Confirmed',
            `Your booking for "${serviceName}" has been placed successfully.`,
            `/(customer)/orders/${bookingId}`,
        );
    } catch (e) {
        logger.error('Push template bookingCreated failed: %O', e);
    }
}

export async function bookingConfirmed(customerId: string, bookingId: string) {
    try {
        await createNotification(
            customerId,
            'BOOKING_CONFIRMED',
            'Booking Confirmed by Merchant',
            'Your booking has been accepted and is being processed.',
            `/(customer)/orders/${bookingId}`,
        );
    } catch (e) {
        logger.error('Push template bookingConfirmed failed: %O', e);
    }
}

export async function agentAssigned(customerId: string, agentName: string, bookingId: string) {
    try {
        await createNotification(
            customerId,
            'AGENT_ASSIGNED',
            'Agent Assigned',
            `${agentName} has been assigned to your booking and will be on the way soon.`,
            `/(customer)/orders/${bookingId}`,
        );
    } catch (e) {
        logger.error('Push template agentAssigned failed: %O', e);
    }
}

export async function jobAssigned(agentUserId: string, bookingId: string, serviceName: string, customerName: string) {
    try {
        await createNotification(
            agentUserId,
            'JOB_ASSIGNED',
            'New Job Assigned',
            `You have a new job: "${serviceName}" for ${customerName}.`,
            `/(agent)/jobs/${bookingId}`,
        );
    } catch (e) {
        logger.error('Push template jobAssigned failed: %O', e);
    }
}

// ─── Job Status Changes ───

export async function jobStatusChanged(customerId: string, status: string, bookingId: string) {
    const statusMessages: Record<string, { title: string; body: string }> = {
        EN_ROUTE: { title: 'Agent On The Way', body: 'Your service agent is heading to your location.' },
        ARRIVED: { title: 'Agent Has Arrived', body: 'Your service agent has arrived at your location.' },
        IN_PROGRESS: { title: 'Service In Progress', body: 'Your service is now being performed.' },
        COMPLETED: { title: 'Service Completed', body: 'Your service has been completed. Please rate your experience!' },
        CANCELLED: { title: 'Booking Cancelled', body: 'Your booking has been cancelled.' },
    };

    const msg = statusMessages[status];
    if (!msg) return;

    try {
        await createNotification(
            customerId,
            'JOB_STATUS_CHANGED',
            msg.title,
            msg.body,
            `/(customer)/orders/${bookingId}`,
        );
    } catch (e) {
        logger.error('Push template jobStatusChanged failed: %O', e);
    }
}

// ─── KYC Events ───

export async function kycApproved(merchantUserId: string) {
    try {
        await createNotification(
            merchantUserId,
            'KYC_APPROVED',
            'KYC Approved! 🎉',
            'Your account has been verified. You can now start receiving bookings.',
        );
    } catch (e) {
        logger.error('Push template kycApproved failed: %O', e);
    }
}

export async function kycRejected(merchantUserId: string, reason: string) {
    try {
        await createNotification(
            merchantUserId,
            'KYC_REJECTED',
            'KYC Verification Update',
            `Your verification was not approved: ${reason}. Please re-submit your documents.`,
        );
    } catch (e) {
        logger.error('Push template kycRejected failed: %O', e);
    }
}

// ─── Chat Events ───

export async function newMessage(recipientUserId: string, senderName: string, preview: string, chatId: string) {
    try {
        await createNotification(
            recipientUserId,
            'NEW_MESSAGE',
            `Message from ${senderName}`,
            preview.length > 80 ? preview.slice(0, 80) + '…' : preview,
            `/chat/${chatId}`,
        );
    } catch (e) {
        logger.error('Push template newMessage failed: %O', e);
    }
}
