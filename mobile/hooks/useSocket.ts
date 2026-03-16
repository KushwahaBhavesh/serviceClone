import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

let socket: Socket | null = null;

/**
 * Hook to manage Socket.IO connection.
 * Automatically connects with user credentials and joins rooms.
 */
export function useSocket() {
    const { accessToken, user } = useAuthStore();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!accessToken || !user) return;

        // Reuse existing connection
        if (socket?.connected) {
            socketRef.current = socket;
            return;
        }

        const baseUrl = (API_BASE_URL || 'http://localhost:3000').replace('/api/v1', '');

        socket = io(baseUrl, {
            auth: { token: accessToken },
            query: { userId: user.id },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });

        socket.on('connect', () => {
            console.log('🔌 Socket connected');
        });

        socket.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
        });

        socketRef.current = socket;

        return () => {
            // Don't disconnect on unmount — keep alive globally
        };
    }, [accessToken, user]);

    const joinBooking = useCallback((bookingId: string) => {
        socketRef.current?.emit('join:booking', bookingId);
    }, []);

    const leaveBooking = useCallback((bookingId: string) => {
        socketRef.current?.emit('leave:booking', bookingId);
    }, []);

    const joinChat = useCallback((chatId: string) => {
        socketRef.current?.emit('join:chat', chatId);
    }, []);

    const leaveChat = useCallback((chatId: string) => {
        socketRef.current?.emit('leave:chat', chatId);
    }, []);

    const onAgentLocation = useCallback((
        callback: (data: { latitude: number; longitude: number; heading?: number; timestamp: string }) => void,
    ) => {
        socketRef.current?.on('agent:location:update', callback);
        return () => { socketRef.current?.off('agent:location:update', callback); };
    }, []);

    const onBookingUpdate = useCallback((
        callback: (data: { bookingId: string; status: string; agentId?: string; eta?: number }) => void,
    ) => {
        socketRef.current?.on('booking:status:update', callback);
        return () => { socketRef.current?.off('booking:status:update', callback); };
    }, []);

    const onChatMessage = useCallback((
        callback: (message: any) => void,
    ) => {
        socketRef.current?.on('chat:message:new', callback);
        return () => { socketRef.current?.off('chat:message:new', callback); };
    }, []);

    const onTyping = useCallback((
        callback: (data: { chatId: string; userId: string; isTyping: boolean }) => void,
    ) => {
        socketRef.current?.on('chat:typing:update', callback);
        return () => { socketRef.current?.off('chat:typing:update', callback); };
    }, []);

    const sendChatMessage = useCallback((chatId: string, content: string, type = 'TEXT') => {
        socketRef.current?.emit('chat:message', {
            chatId,
            senderId: user?.id,
            content,
            type,
        });
    }, [user]);

    const sendTyping = useCallback((chatId: string, isTyping: boolean) => {
        socketRef.current?.emit('chat:typing', {
            chatId,
            userId: user?.id,
            isTyping,
        });
    }, [user]);

    const onNotification = useCallback((
        callback: (notification: { id: string; type: string; title: string; body: string; deepLink?: string }) => void,
    ) => {
        socketRef.current?.on('notification:new', callback);
        return () => { socketRef.current?.off('notification:new', callback); };
    }, []);

    return {
        socket: socketRef.current,
        joinBooking,
        leaveBooking,
        joinChat,
        leaveChat,
        onAgentLocation,
        onBookingUpdate,
        onChatMessage,
        onTyping,
        sendChatMessage,
        sendTyping,
        onNotification,
    };
}
