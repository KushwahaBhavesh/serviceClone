import api from './api';
import type { Address, Booking, BookingItem, Service } from './marketplace';

// ─── Types ───

export interface MerchantDashboard {
    todayRevenue: number;
    todayOrders: number;
    activeOrders: number;
    pendingOrders: number;
    agentCount: number;
    rating: number;
    totalReviews: number;
    verificationStatus: string;
}

export interface MerchantService {
    id: string;
    merchantId: string;
    serviceId: string;
    price: number;
    unit?: string | null;
    description?: string | null;
    isActive: boolean;
    service: Service & { category: { id: string; name: string; slug: string } };
}

export interface Agent {
    id: string;
    userId: string;
    merchantId: string;
    skills: string[];
    status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
    rating: number;
    isActive: boolean;
    lastLocationLat?: number | null;
    lastLocationLng?: number | null;
    user: { id: string; name: string | null; phone: string | null; email: string | null; avatarUrl: string | null };
    bookings?: Booking[];
}

export interface Slot {
    id: string;
    merchantId: string;
    agentId: string | null;
    date: string;
    startTime: string;
    endTime: string;
    isBooked: boolean;
    agent?: { user: { name: string | null } } | null;
}

export interface Promotion {
    id: string;
    merchantId: string;
    code: string;
    type: 'PERCENTAGE' | 'FLAT';
    value: number;
    minOrderValue: number | null;
    maxDiscount: number | null;
    startDate: string;
    expiryDate: string;
    usageLimit: number | null;
    currentUsage: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Earnings {
    earnings: {
        totalRevenue: number;
        subtotal: number;
        taxCollected: number;
        orderCount: number;
        totalPlatformFees?: number;
    };
    bookings: Booking[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface AnalyticsDashboard {
    revenueTrends: { date: string; amount: number }[];
    topServices: { id: string; name: string; count: number; revenue: number }[];
    topAgents: { id: string; name: string; rating: number; completedJobs: number }[];
}

export type KycDocType = 'PAN_CARD' | 'AADHAAR' | 'GST_CERTIFICATE' | 'BUSINESS_LICENSE' | 'BANK_PROOF' | 'OTHER';

export interface SubmitKycDocInput {
    type: KycDocType;
    fileUrl: string;
}

export type PeriodKey = 'day' | 'week' | 'month';

export interface MerchantOrderEvent {
    id: string;
    status: string;
    createdAt: string;
    note: string | null;
    actor: { name: string | null; role: string } | null;
}

export interface VerificationDoc {
    id: string;
    merchantId: string;
    type: string;
    fileUrl: string;
    status: string;
    reviewNote: string | null;
}

export interface MerchantSettings {
    id: string;
    businessName: string;
    description: string | null;
    logoUrl: string | null;
    coverImageUrl: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    latitude: number | null;
    longitude: number | null;
    serviceRadius: number;
    rating: number;
    totalReviews: number;
    isVerified: boolean;
    verificationStatus: string;
    gstNumber: string | null;
    panNumber: string | null;
    bankAccountNumber: string | null;
    bankIfscCode: string | null;
    bankAccountName: string | null;
    verificationDocs: VerificationDoc[];
}

export interface Review {
    id: string;
    rating: number;
    comment: string | null;
    merchantReply: string | null;
    merchantReplyAt: string | null;
    createdAt: string;
    booking: { bookingNumber: string };
    user: { name: string | null; avatarUrl: string | null };
}

export interface MerchantNotification {
    id: string;
    type: string;
    title: string;
    body: string;
    deepLink: string | null;
    readAt: string | null;
    createdAt: string;
}

export interface Chat {
    id: string;
    bookingId: string;
    messages: any[];
    participants: any[];
    booking?: any;
    isActive?: boolean;
}

// ─── API Client ───

const MERCHANT = '/api/v1/merchant';

export const merchantApi = {
    // Dashboard
    getDashboard: () =>
        api.get<{ dashboard: MerchantDashboard }>(MERCHANT + '/dashboard'),

    // Service Catalog
    listServices: () =>
        api.get<{ services: MerchantService[] }>(MERCHANT + '/services'),

    enableService: (data: { serviceId: string; price: number; unit?: string; description?: string }) =>
        api.post<{ service: MerchantService }>(MERCHANT + '/services', data),

    updateService: (id: string, data: { price?: number; unit?: string; description?: string; isActive?: boolean }) =>
        api.put<{ service: MerchantService }>(MERCHANT + `/services/${id}`, data),

    disableService: (id: string) =>
        api.delete(MERCHANT + `/services/${id}`),

    createCustomService: (data: {
        name: string;
        description?: string;
        categoryId: string;
        price: number;
        unit?: string;
        duration?: number;
        imageUrl?: string;
    }) =>
        api.post<{ service: MerchantService }>(MERCHANT + '/services/custom', data),

    // Orders
    listOrders: (params?: { status?: string; page?: number; limit?: number }) =>
        api.get<{
            orders: Booking[];
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        }>(MERCHANT + '/orders', { params }),

    getOrder: (id: string) =>
        api.get<{ booking: Booking & { events: MerchantOrderEvent[]; agent: Agent | null } }>(MERCHANT + `/orders/${id}`),

    acceptOrder: (id: string) =>
        api.patch<{ booking: Booking }>(MERCHANT + `/orders/${id}/accept`),

    rejectOrder: (id: string) =>
        api.patch<{ booking: Booking }>(MERCHANT + `/orders/${id}/reject`),

    assignAgent: (id: string, agentId: string) =>
        api.post<{ booking: Booking }>(MERCHANT + `/orders/${id}/assign`, { agentId }),

    // Agents
    getAgentStatusGrid: () =>
        api.get<{ agents: Agent[] }>(MERCHANT + '/agents/status-grid'),

    getAgentLiveLocations: () =>
        api.get<{ agents: Agent[] }>(MERCHANT + '/agents/live'),

    mockAgentLocation: (data: { userId: string; lat: number; lng: number }) =>
        api.post<{ agent: Agent }>(MERCHANT + '/agents/mock-location', data),

    listAgents: () =>
        api.get<{ agents: Agent[] }>(MERCHANT + '/agents'),

    createAgent: (data: { name: string; phone: string; email?: string; skills?: string[] }) =>
        api.post<{ agent: Agent }>(MERCHANT + '/agents', data),

    updateAgent: (id: string, data: { skills?: string[]; isActive?: boolean }) =>
        api.put<{ agent: Agent }>(MERCHANT + `/agents/${id}`, data),

    // Slots
    listSlots: (date?: string) =>
        api.get<{ slots: Slot[] }>(MERCHANT + '/slots', { params: { date } }),

    createSlots: (data: {
        date: string;
        slots: { startTime: string; endTime: string; agentId?: string }[];
    }) => api.post<{ created: number }>(MERCHANT + '/slots/bulk', data),

    // Earnings
    getEarnings: (params?: { period?: 'day' | 'week' | 'month'; page?: number; limit?: number }) =>
        api.get<Earnings>(MERCHANT + '/earnings', { params }),

    // KYC
    submitKycDoc: (data: SubmitKycDocInput) =>
        api.post<{ document: VerificationDoc }>(MERCHANT + '/kyc', data),

    // Settings
    getSettings: () =>
        api.get<{ settings: MerchantSettings }>(MERCHANT + '/settings'),

    updateSettings: (data: Partial<Omit<MerchantSettings, 'id' | 'rating' | 'totalReviews' | 'isVerified' | 'verificationStatus' | 'verificationDocs'>>) =>
        api.put<{ settings: MerchantSettings }>(MERCHANT + '/settings', data),

    // Common Upload
    uploadFile: async (fileUri: string, fieldName: string = 'file') => {
        const formData = new FormData();
        const filename = fileUri.split('/').pop() || 'upload.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append(fieldName, {
            uri: fileUri,
            name: filename,
            type,
        } as any);

        return api.post<{ fileUrl: string; filename: string }>('/api/v1/common/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    // Promotions
    listPromotions: () =>
        api.get<{ promotions: Promotion[] }>(MERCHANT + '/promotions'),

    createPromotion: (data: any) =>
        api.post<{ promotion: Promotion }>(MERCHANT + '/promotions', data),

    updatePromotion: (id: string, data: { isActive: boolean }) =>
        api.put<{ promotion: Promotion }>(MERCHANT + `/promotions/${id}`, data),

    // Analytics
    getAnalytics: (days?: number) =>
        api.get<{ analytics: AnalyticsDashboard }>(MERCHANT + '/analytics', { params: { days } }),

    listChats: () =>
        api.get<{ chats: any[] }>(MERCHANT + '/chat'),

    openChat: (bookingId: string) =>
        api.post<{ chat: any }>(`${MERCHANT}/chat/open/${bookingId}`),

    getChatMessages: (chatId: string, params?: { page?: number; limit?: number }) =>
        api.get<{ messages: any[]; total: number }>(`${MERCHANT}/chat/${chatId}/messages`, { params }),

    sendMessage: (chatId: string, content: string) =>
        api.post<{ message: any }>(`${MERCHANT}/chat/${chatId}/messages`, { content }),

    // Reviews
    listReviews: (params?: { page?: number; limit?: number }) =>
        api.get<{ reviews: Review[]; total: number; avgRating: number }>(MERCHANT + '/reviews', { params }),

    replyToReview: (reviewId: string, reply: string) =>
        api.post<{ review: Review }>(MERCHANT + `/reviews/${reviewId}/reply`, { reply }),

    // Notifications
    listNotifications: (params?: { unreadOnly?: boolean; page?: number; limit?: number }) =>
        api.get<{ notifications: MerchantNotification[]; unreadCount: number }>(MERCHANT + '/notifications', { params }),

    markNotificationRead: (id: string) =>
        api.patch(MERCHANT + `/notifications/${id}/read`),

    markAllNotificationsRead: () =>
        api.post(MERCHANT + '/notifications/read-all'),

    updatePushToken: (token: string) =>
        api.post(MERCHANT + '/push-token', { token }),
};
