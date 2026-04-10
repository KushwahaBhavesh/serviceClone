import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface AgentLocation {
    latitude: number;
    longitude: number;
    heading?: number;
    timestamp: string;
}

/**
 * Subscribe to real-time agent location updates for a booking.
 * Uses Socket.IO to listen for `agent:location:update` events.
 */
export function useAgentTracking(bookingId: string | undefined) {
    const token = useAuthStore((s: any) => s.token);
    const socketRef = useRef<Socket | null>(null);
    const [location, setLocation] = useState<AgentLocation | null>(null);
    const [isEnded, setIsEnded] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!bookingId || !token) return;

        const socket = io(API_URL, {
            auth: { token },
            query: { userId: useAuthStore.getState().user?.id },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            socket.emit('join:booking', bookingId);
        });

        socket.on('disconnect', () => setIsConnected(false));

        socket.on('reconnect', () => {
            socket.emit('join:booking', bookingId);
        });

        socket.on('agent:location:update', (data: AgentLocation) => {
            setLocation(data);
        });

        socket.on('booking:status:update', (data: { status: string }) => {
            if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
                setIsEnded(true);
            }
        });

        return () => {
            socket.emit('leave:booking', bookingId);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [bookingId, token]);

    return { location, isEnded, isConnected };
}
