import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketServer;

// ─── Initialize Socket.IO ───

export function initializeSocket(httpServer: HttpServer) {
    io = new SocketServer(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
        pingInterval: 25000,
        pingTimeout: 60000,
    });

    io.on('connection', (socket: Socket) => {
        const userId = socket.handshake.query.userId as string;
        if (userId) {
            socket.join(`user:${userId}`);
        }

        // ─── Booking Tracking Room ───
        socket.on('join:booking', (bookingId: string) => {
            socket.join(`booking:${bookingId}`);
        });

        socket.on('leave:booking', (bookingId: string) => {
            socket.leave(`booking:${bookingId}`);
        });

        // ─── Chat Room ───
        socket.on('join:chat', (chatId: string) => {
            socket.join(`chat:${chatId}`);
        });

        socket.on('leave:chat', (chatId: string) => {
            socket.leave(`chat:${chatId}`);
        });

        // ─── Agent Location Update (sent by agent app) ───
        socket.on('agent:location', (data: {
            bookingId: string;
            latitude: number;
            longitude: number;
            heading?: number;
        }) => {
            io.to(`booking:${data.bookingId}`).emit('agent:location:update', {
                latitude: data.latitude,
                longitude: data.longitude,
                heading: data.heading,
                timestamp: new Date().toISOString(),
            });
        });

        // ─── Chat Message (real-time relay) ───
        socket.on('chat:message', (data: {
            chatId: string;
            senderId: string;
            content: string;
            type?: string;
        }) => {
            socket.to(`chat:${data.chatId}`).emit('chat:message:new', {
                chatId: data.chatId,
                senderId: data.senderId,
                content: data.content,
                type: data.type || 'TEXT',
                createdAt: new Date().toISOString(),
            });
        });

        // ─── Typing Indicator ───
        socket.on('chat:typing', (data: { chatId: string; userId: string; isTyping: boolean }) => {
            socket.to(`chat:${data.chatId}`).emit('chat:typing:update', data);
        });

        socket.on('disconnect', () => {
            // cleanup handled by Socket.IO automatically
        });
    });

    return io;
}

// ─── Emit Helpers (used by services) ───

export function getIO(): SocketServer {
    if (!io) throw new Error('Socket.IO not initialized');
    return io;
}

/** Emit booking status update to all watchers */
export function emitBookingUpdate(bookingId: string, data: {
    status: string;
    agentId?: string;
    eta?: number;
}) {
    if (!io) return;
    io.to(`booking:${bookingId}`).emit('booking:status:update', {
        bookingId,
        ...data,
        timestamp: new Date().toISOString(),
    });
}

/** Emit new chat message to room */
export function emitChatMessage(chatId: string, message: {
    id: string;
    senderId: string;
    content: string;
    type: string;
    createdAt: string;
    sender: { id: string; name: string | null; avatarUrl: string | null; role: string };
}) {
    if (!io) return;
    io.to(`chat:${chatId}`).emit('chat:message:new', message);
}

/** Emit notification to specific user */
export function emitNotification(userId: string, notification: {
    id: string;
    type: string;
    title: string;
    body: string;
    deepLink?: string;
}) {
    if (!io) return;
    io.to(`user:${userId}`).emit('notification:new', notification);
}
