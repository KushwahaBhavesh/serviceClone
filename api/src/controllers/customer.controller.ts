import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendCreated } from '../utils/response';
import * as customerService from '../services/customer.service';
import * as chatService from '../services/chat.service';
import * as notificationService from '../services/notification.service';

// ─── ADDRESSES ───

export async function listAddresses(req: AuthenticatedRequest, res: Response) {
    const result = await customerService.listAddresses(req.user.id);
    sendSuccess(res, { addresses: result });
}

export async function createAddress(req: AuthenticatedRequest, res: Response) {
    const result = await customerService.createAddress(req.user.id, req.body);
    sendCreated(res, { address: result });
}

export async function updateAddress(req: AuthenticatedRequest, res: Response) {
    const result = await customerService.updateAddress(req.user.id, String(req.params.id), req.body);
    sendSuccess(res, { address: result });
}

export async function deleteAddress(req: AuthenticatedRequest, res: Response) {
    await customerService.deleteAddress(req.user.id, String(req.params.id));
    sendSuccess(res, null, 'Address deleted');
}

// ─── WALLET ───

export async function getWallet(req: AuthenticatedRequest, res: Response) {
    const result = await customerService.getWalletData(req.user.id);
    sendSuccess(res, result);
}

export async function topupWallet(req: AuthenticatedRequest, res: Response) {
    const result = await customerService.topupWallet(req.user.id, req.body);
    sendSuccess(res, result);
}

// ─── ENGAGEMENT ───

export async function listReviews(req: AuthenticatedRequest, res: Response) {
    const result = await customerService.listMyReviews(req.user.id);
    sendSuccess(res, { reviews: result });
}

export async function listNotifications(req: AuthenticatedRequest, res: Response) {
    const result = await customerService.listMyNotifications(req.user.id);
    sendSuccess(res, result);
}

export async function markAllNotificationsRead(req: AuthenticatedRequest, res: Response) {
    await customerService.markAllNotificationsRead(req.user.id);
    sendSuccess(res, null, 'All notifications marked as read');
}

export async function listChats(req: AuthenticatedRequest, res: Response) {
    const result = await customerService.listMyChats(req.user.id);
    sendSuccess(res, { chats: result });
}

export async function openChat(req: AuthenticatedRequest, res: Response) {
    const { bookingId } = req.params;
    const { merchantId, bookingId: bodyBookingId } = req.body;
    
    const bId = bookingId || bodyBookingId;
    
    const chat = await chatService.getOrCreateChat(
        req.user.id, 
        bId, 
        'CUSTOMER', 
        merchantId
    );
    sendSuccess(res, { chat });
}

export async function getChatMessages(req: AuthenticatedRequest, res: Response) {
    const { page, limit } = req.query;
    const result = await chatService.getChatMessages(req.user.id, String(req.params.chatId), {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    sendSuccess(res, result);
}

export async function sendChatMessage(req: AuthenticatedRequest, res: Response) {
    const { content, type, fileUrl, fileName } = req.body;
    const message = await chatService.sendChatMessage(
        req.user.id,
        String(req.params.chatId),
        content,
        type,
        fileUrl,
        fileName
    );
    sendCreated(res, { message });
}

// ─── PUSH TOKEN ───

export async function updatePushToken(req: AuthenticatedRequest, res: Response) {
    const { token } = req.body;
    if (!token) {
        return sendSuccess(res, null, 'Token is required');
    }
    await notificationService.updatePushToken(req.user.id, token);
    sendSuccess(res, null, 'Push token updated');
}
