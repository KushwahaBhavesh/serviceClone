import api from './api';
import type { Address, Booking, BookingItem, Service } from './marketplace';

// ─── Types ───

export interface AgentDashboard {
    todayAssigned: number;
    todayCompleted: number;
    todayEarnings: number;
    rating: number;
    status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
}

export interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    readAt: string | null;
    createdAt: string;
    deepLink?: string;
}

export interface Chat {
    id: string;
    bookingId: string;
    messages: any[];
    participants: any[];
}

export interface AgentJob extends Booking {
    address: Address;
    customer: {
        id: string;
        name: string;
        phone: string | null;
        avatarUrl: string | null;
    };
    items: (BookingItem & { service: Service })[];
}

export interface AgentJobsResponse {
    activeJobs: AgentJob[];
    upcomingJobs: AgentJob[];
}

export interface AgentHistoryResponse {
    jobs: AgentJob[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ─── API Endpoints ───

export const agentApi = {
    /**
     * Get agent dashboard KPIs
     */
    getDashboard: () => api.get<AgentDashboard>('/agent/dashboard'),

    /**
     * Get all active and upcoming assigned jobs
     */
    getJobs: () => api.get<AgentJobsResponse>('/agent/jobs'),

    /**
     * Get full details of a specific job
     */
    getJobDetails: (id: string) => api.get<AgentJob>(`/agent/jobs/${id}`),

    /**
     * Update job status (workflow transition)
     */
    updateJobStatus: (id: string, status: string, proofOfWorkUrls?: string[], otp?: string) =>
        api.patch<{ booking: AgentJob }>(`/agent/jobs/${id}/status`, { status, proofOfWorkUrls, otp }),

    /**
     * Get agent job history
     */
    getHistory: (params?: { page?: number; limit?: number }) =>
        api.get<AgentHistoryResponse>('/agent/history', { params }),

    /**
     * Toggle Online/Offline status
     */
    updateAvailability: (isOnline: boolean) =>
        api.put<{ message: string; data: { status: string } }>('/agent/availability', { isOnline }),

    // Future placeholders for next phases
    updateLocation: (lat: number, lng: number) =>
        api.post('/agent/location', { lat, lng }),

    acceptJob: (jobId: string) =>
        api.post(`/agent/jobs/${jobId}/accept`),

    // ─── CHAT ───
    listChats: () =>
        api.get<{ chats: Chat[] }>('/agent/chat'),

    openChat: (bookingId: string) =>
        api.post<{ chat: Chat }>(`/agent/chat/open/${bookingId}`),

    getChatMessages: (chatId: string, params?: { page?: number; limit?: number }) =>
        api.get<{ messages: any[]; total: number }>(`/agent/chat/${chatId}/messages`, { params }),

    sendMessage: (chatId: string, content: string) =>
        api.post<{ message: any }>(`/agent/chat/${chatId}/messages`, { content }),
};
