import prisma from '../lib/prisma';
import { BadRequestError } from '../middleware/error-handler';
import { emitChatMessage } from '../socket';

export async function getOrCreateChat(
    userId: string,
    bookingId?: string | null,
    role: 'MERCHANT' | 'AGENT' | 'CUSTOMER' = 'CUSTOMER',
    merchantId?: string | null
) {
    // 1. If bookingId is provided, follow booking-based logic
    if (bookingId) {
        const where: any = { id: bookingId };
        if (role === 'MERCHANT') where.merchantId = userId;
        else if (role === 'AGENT') where.agent = { userId };
        else if (role === 'CUSTOMER') where.customerId = userId;

        const booking = await prisma.booking.findFirst({ where }); // RESTORED SECURITY CHECK
        if (!booking) throw new BadRequestError('Booking not found or access denied');

        let chat = await prisma.chat.findUnique({
            where: { bookingId },
            include: {
                messages: { orderBy: { createdAt: 'desc' }, take: 50 },
                participants: { include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } } },
            },
        });

        if (!chat) {
            const participantUserIds: string[] = [booking.customerId];
            if (booking.merchantId) participantUserIds.push(booking.merchantId);
            if (booking.agentId) {
                const agent = await prisma.agent.findUnique({ where: { id: booking.agentId } });
                if (agent) participantUserIds.push(agent.userId);
            }

            chat = await prisma.chat.create({
                data: {
                    bookingId,
                    participants: {
                        create: Array.from(new Set(participantUserIds)).map(uid => ({ userId: uid })),
                    },
                },
                include: {
                    messages: { orderBy: { createdAt: 'desc' }, take: 50 },
                    participants: { include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } } },
                },
            });
        }
        return chat;
    }

    // 2. Direct Chat Logic (if no bookingId)
    if (!merchantId) throw new BadRequestError('Either bookingId or merchantId is required');

    // Find if a direct chat (no bookingId) already exists between these two participants
    let chat = await prisma.chat.findFirst({
        where: {
            bookingId: null,
            AND: [
                { participants: { some: { userId } } },
                { participants: { some: { userId: merchantId } } }
            ]
        },
        include: {
            messages: { orderBy: { createdAt: 'desc' }, take: 50 },
            participants: { include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } } },
        },
    });

    if (!chat) {
        chat = await prisma.chat.create({
            data: {
                bookingId: null,
                participants: {
                    create: [{ userId }, { userId: merchantId }]
                },
            },
            include: {
                messages: { orderBy: { createdAt: 'desc' }, take: 50 },
                participants: { include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } } },
            },
        });
    }

    return chat;
}

export async function getChatMessages(
    userId: string,
    chatId: string,
    options: { page?: number; limit?: number } = {},
) {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const participant = await prisma.chatParticipant.findFirst({
        where: { chatId, userId },
    });
    if (!participant) throw new BadRequestError('Not a participant in this chat');

    await prisma.chatParticipant.update({
        where: { id: participant.id },
        data: { lastSeenAt: new Date() },
    });

    const [messages, total] = await Promise.all([
        prisma.message.findMany({
            where: { chatId },
            include: { sender: { select: { id: true, name: true, avatarUrl: true, role: true } } },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.message.count({ where: { chatId } }),
    ]);

    return { messages: messages.reverse(), total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function sendChatMessage(
    userId: string,
    chatId: string,
    content: string,
    type: string = 'TEXT',
    fileUrl?: string,
    fileName?: string
) {
    const participant = await prisma.chatParticipant.findFirst({
        where: { chatId, userId },
    });
    if (!participant) throw new BadRequestError('Not a participant in this chat');

    const message = await prisma.message.create({
        data: {
            chatId,
            senderId: userId,
            content,
            type,
            fileUrl,
            fileName,
        },
        include: { sender: { select: { id: true, name: true, avatarUrl: true, role: true } } },
    });

    // Touch the chat to update its 'updatedAt' timestamp for correct sorting in chat lists
    await prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
    });

    await prisma.chatParticipant.update({
        where: { id: participant.id },
        data: { lastSeenAt: new Date() },
    });

    // Broadcast real-time message via Socket.IO
    emitChatMessage(chatId, {
        id: message.id,
        senderId: message.senderId,
        content: message.content,
        type: message.type,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        createdAt: message.createdAt.toISOString(),
        sender: {
            id: message.sender.id,
            name: message.sender.name,
            avatarUrl: message.sender.avatarUrl,
            role: message.sender.role
        }
    });

    return message;
}

export async function listChats(userId: string) {
    return prisma.chat.findMany({
        where: {
            participants: { some: { userId } },
        },
        include: {
            booking: {
                include: {
                    items: { include: { service: true } },
                    customer: { select: { id: true, name: true, avatarUrl: true } },
                    merchant: { select: { id: true, name: true, avatarUrl: true } },
                    agent: { include: { user: { select: { name: true, avatarUrl: true } } } },
                },
            },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
            participants: {
                include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } }
            }
        },
        orderBy: { updatedAt: 'desc' },
    });
}
