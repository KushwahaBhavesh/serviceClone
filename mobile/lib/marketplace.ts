import api from './api';

// ─── Types ───

export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    iconUrl: string | null;
    imageUrl: string | null;
    sortOrder: number;
    isActive: boolean;
    parentId: string | null;
    children?: Category[];
    _count?: { services: number };
}

export interface ServiceUnit {
    id: string;
    name: string;
    label: string;
}

export interface Service {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    basePrice: number;
    unit: string;
    duration: number;
    category?: { id: string; name: string; slug: string };
    merchantServices?: {
        id: string;
        price: number;
        isActive: boolean;
        merchant: {
            id: string;
            businessName: string;
            rating: number;
            totalReviews: number;
            isVerified: boolean;
            logoUrl: string | null;
            city: string | null;
        };
    }[];
    _count?: { merchantServices: number };
}

export interface NearbyMerchant {
    id: string;
    businessName: string;
    rating: number;
    totalReviews: number;
    isVerified: boolean;
    logoUrl: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    distance: number;
    user: { name: string | null; avatarUrl: string | null };
    merchantServices: { service: { name: string; category?: { name: string } } }[];
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
    distance?: number;
    merchant: {
        id: string;
        businessName: string;
        logoUrl: string | null;
        serviceRadius: number;
    };
}

export interface MerchantProfileData {
    id: string;
    businessName: string;
    businessCategory: string | null;
    description: string | null;
    logoUrl: string | null;
    coverImageUrl: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    latitude: number | null;
    longitude: number | null;
    serviceRadius: number;
    rating: number;
    totalReviews: number;
    isVerified: boolean;
    owner: { name: string | null; avatarUrl: string | null; phone: string | null };
    services: {
        merchantServiceId: string;
        id: string;
        name: string;
        slug: string;
        description: string | null;
        imageUrl: string | null;
        basePrice: number;
        price: number;
        unit: string;
        duration: number;
        category: { id: string; name: string } | null;
    }[];
    reviews: {
        id: string;
        rating: number;
        comment: string | null;
        createdAt: string;
        user: { name: string | null; avatarUrl: string | null };
    }[];
}


export interface Address {
    id: string;
    label: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    zipCode: string;
    latitude: number | null;
    longitude: number | null;
    isDefault: boolean;
}

export interface BookingItem {
    id: string;
    serviceId: string;
    quantity: number;
    price: number;
    notes: string | null;
    service?: Service;
}

export interface Booking {
    id: string;
    bookingNumber: string;
    status: 'PENDING' | 'ACCEPTED' | 'AGENT_ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
    paymentStatus: string;
    subtotal: number;
    tax: number;
    total: number;
    scheduledAt: string;
    completedAt: string | null;
    notes: string | null;
    items: BookingItem[];
    address?: Address;
    customer?: { id: string; name: string; phone: string | null; avatarUrl: string | null };
    merchant?: { id: string; name: string; phone: string | null; avatarUrl: string | null };
    agent?: { id: string; user: { id: string; name: string | null; avatarUrl: string | null } };
}

export interface PaginatedResponse<T> {
    pagination: { page: number; limit: number; total: number; totalPages: number };
    [key: string]: T[] | any;
}

// ─── Catalog API ───

const CATALOG = '/api/v1/catalog';
const BOOKINGS = '/api/v1/bookings';

export const catalogApi = {
    listCategories: (parentId?: string) =>
        api.get<{ categories: Category[] }>(CATALOG + '/categories', { params: { parentId } }),

    listUnits: () =>
        api.get<{ units: ServiceUnit[] }>(CATALOG + '/units'),

    getCategoryBySlug: (slug: string) =>
        api.get<{ category: Category & { services: Service[] } }>(CATALOG + `/categories/${slug}`),

    listServices: (params?: { categoryId?: string; search?: string; page?: number; limit?: number; sortBy?: string }) =>
        api.get<{ services: Service[]; pagination: PaginatedResponse<Service>['pagination'] }>(
            CATALOG + '/services', { params },
        ),

    getServiceBySlug: (slug: string) =>
        api.get<{ service: Service }>(CATALOG + `/services/${slug}`),

    listNearbyMerchants: (params: { latitude: number; longitude: number; radius?: number; categoryId?: string; limit?: number }) =>
        api.get<{ merchants: NearbyMerchant[] }>(CATALOG + '/merchants/nearby', { params }),

    getServiceReviews: (serviceId: string, params?: { page?: number; limit?: number }) =>
        api.get<{ reviews: any[]; total: number; page: number; totalPages: number; avgRating: number }>(
            CATALOG + `/services/${serviceId}/reviews`, { params },
        ),

    getServiceSlots: (serviceId: string, date: string) =>
        api.get<{ slots: any[]; date: string }>(
            CATALOG + `/services/${serviceId}/slots`, { params: { date } },
        ),

    validatePromo: (code: string, orderTotal: number) =>
        api.post<{ valid: boolean; code: string; type: string; value: number; discount: number; message: string }>(
            CATALOG + '/promotions/validate', { code, orderTotal },
        ),

    listNearbyPromotions: (params: { latitude: number; longitude: number; limit?: number }) =>
        api.get<{ promotions: Promotion[] }>(CATALOG + '/nearby-promos', { params }),

    getMerchantProfile: (id: string) =>
        api.get<{ merchant: MerchantProfileData }>(CATALOG + `/merchants/${id}`),
};

// ─── Booking API ───

export const bookingApi = {
    listAddresses: () =>
        api.get<{ addresses: Address[] }>(BOOKINGS + '/addresses'),

    createAddress: (data: Omit<Address, 'id'>) =>
        api.post<{ address: Address }>(BOOKINGS + '/addresses', data),

    createBooking: (data: {
        addressId: string;
        scheduledAt: string;
        notes?: string;
        items: { serviceId: string; quantity: number; notes?: string }[];
    }) => api.post<{ booking: Booking }>(BOOKINGS, data),

    listBookings: (params?: { status?: string; page?: number; limit?: number }) =>
        api.get<{ bookings: Booking[]; pagination: PaginatedResponse<Booking>['pagination'] }>(
            BOOKINGS, { params },
        ),

    getBooking: (id: string) =>
        api.get<{ booking: Booking }>(BOOKINGS + `/${id}`),

    updateStatus: (id: string, data: { status: string; cancellationReason?: string }) =>
        api.patch<{ booking: Booking }>(BOOKINGS + `/${id}/status`, data),

    createReview: (data: { bookingId: string; rating: number; comment?: string; imageUrls?: string[] }) =>
        api.post(BOOKINGS + '/reviews', data),

    getActiveBooking: () =>
        api.get<{ bookings: Booking[]; pagination: any }>(BOOKINGS, {
            params: { status: 'ACCEPTED,AGENT_ASSIGNED,EN_ROUTE,ARRIVED,IN_PROGRESS', page: 1, limit: 1 },
        }),

    reorderBooking: (previousBooking: Booking) => {
        const items = previousBooking.items.map(item => ({
            serviceId: item.serviceId,
            quantity: item.quantity,
        }));
        return api.post<{ booking: Booking }>(BOOKINGS, {
            addressId: previousBooking.address?.id || '',
            scheduledAt: new Date().toISOString(),
            notes: previousBooking.notes || undefined,
            items,
        });
    },
};

// ─── Payment API ───

const PAYMENTS = '/api/v1/payments';

export const paymentApi = {
    initiate: (data: { bookingId: string; method: 'WALLET' | 'RAZORPAY' | 'UPI' | 'CARD' }) =>
        api.post<{
            status: string; method: string; amount: number;
            orderId?: string; transactionId: string;
            newBalance?: number;
            gatewayConfig?: {
                key: string; amount: number; currency: string;
                name: string; description: string; orderId: string;
            };
        }>(PAYMENTS + '/initiate', data),

    confirm: (data: {
        transactionId: string;
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
    }) =>
        api.post<{ status: string; transactionId: string }>(PAYMENTS + '/confirm', data),

    refund: (data: { bookingId: string; reason?: string }) =>
        api.post<{ status: string; amount: number; newBalance: number; transactionId: string }>(PAYMENTS + '/refund', data),

    listMethods: () =>
        api.get<{ wallet: { balance: number }; savedMethods: any[]; available: string[] }>(PAYMENTS + '/methods'),

    walletTopup: (data: { amount: number }) =>
        api.post<{
            status: string; orderId: string; transactionId: string;
            gatewayConfig: {
                key: string; amount: number; currency: string;
                name: string; description: string; orderId: string;
            };
        }>(PAYMENTS + '/wallet/topup', data),

    walletConfirm: (data: {
        transactionId: string;
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
    }) =>
        api.post<{ status: string; transactionId: string; amount: number; newBalance: number }>(PAYMENTS + '/wallet/confirm', data),
};

// ─── Customer API ───

const CUSTOMER = '/api/v1/customer';

export interface WalletTransaction {
    id: string;
    amount: number;
    type: 'TOPUP' | 'PAYMENT' | 'REFUND' | 'COMMISSION' | 'WITHDRAWAL';
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    description: string | null;
    referenceId: string | null;
    createdAt: string;
}

export interface Review {
    id: string;
    bookingId: string;
    rating: number;
    comment: string | null;
    imageUrls: string[];
    merchantReply: string | null;
    createdAt: string;
    booking?: Booking;
}

export interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    deepLink: string | null;
    readAt: string | null;
    createdAt: string;
}

export interface ChatMessage {
    id: string;
    chatId: string;
    content: string;
    type?: string;
    createdAt: string;
    sender: {
        id: string;
        name: string | null;
        avatarUrl: string | null;
        role: string;
    };
}

export interface Chat {
    id: string;
    bookingId: string;
    isActive: boolean;
    updatedAt: string;
    booking: Booking;
    messages: { id: string; content: string; createdAt: string }[];
    participants?: { userId: string; user: { id: string; name: string | null; avatarUrl: string | null; role: string } }[];
}

export const customerApi = {
    listAddresses: () =>
        api.get<{ addresses: Address[] }>(CUSTOMER + '/addresses'),

    createAddress: (data: Omit<Address, 'id'>) =>
        api.post<{ address: Address }>(CUSTOMER + '/addresses', data),

    updateAddress: (id: string, data: Partial<Omit<Address, 'id'>>) =>
        api.put<{ address: Address }>(CUSTOMER + `/addresses/${id}`, data),

    deleteAddress: (id: string) =>
        api.delete(CUSTOMER + `/addresses/${id}`),

    getWallet: () =>
        api.get<{ balance: number; transactions: WalletTransaction[] }>(CUSTOMER + '/wallet'),

    topupWallet: (data: { amount: number; paymentMethod?: string }) =>
        api.post<{ transaction: WalletTransaction; newBalance: number }>(CUSTOMER + '/wallet/topup', data),

    listReviews: () =>
        api.get<{ reviews: Review[] }>(CUSTOMER + '/reviews'),

    listNotifications: () =>
        api.get<{ notifications: Notification[]; unreadCount: number }>(CUSTOMER + '/notifications'),

    markNotificationsRead: () =>
        api.post<{ success: boolean }>(CUSTOMER + '/notifications/read-all'),

    listChats: () =>
        api.get<{ chats: Chat[] }>(CUSTOMER + '/chats'),

    openChat: (bookingId: string) =>
        api.post<{ chat: Chat }>(CUSTOMER + `/chats/open/${bookingId}`),

    getChatMessages: (chatId: string, params?: { page?: number; limit?: number }) =>
        api.get<{ messages: ChatMessage[]; total: number; page: number; totalPages: number }>(
            CUSTOMER + `/chats/${chatId}/messages`, { params },
        ),

    sendMessage: (chatId: string, content: string) =>
        api.post<{ message: ChatMessage }>(CUSTOMER + `/chats/${chatId}/messages`, { content }),

    aiAssistant: {
        chat: (content: string, context?: any) =>
            api.post<{ reply: string }>(CUSTOMER + '/ai-assistant/chat', { content, context }),
    },
};
