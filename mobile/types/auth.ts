// Auth-related TypeScript types shared across the mobile app

export type UserRole = 'CUSTOMER' | 'MERCHANT' | 'AGENT' | 'ADMIN';

export type UserStatus = 'PENDING_VERIFICATION' | 'ONBOARDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export type AuthProvider = 'EMAIL' | 'PHONE' | 'GOOGLE' | 'APPLE';

export interface User {
    id: string;
    email?: string;
    phone?: string;
    name?: string;
    avatarUrl?: string;
    role: UserRole;
    status: UserStatus;
    authProvider: AuthProvider;
    onboardingCompleted: boolean;
    locationName?: string;
    latitude?: number;
    longitude?: number;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    isNewUser?: boolean;
}

export interface ApiError {
    success: false;
    statusCode: number;
    message: string;
    errors?: string[];
    timestamp: string;
}

// Request DTOs
export interface RegisterRequest {
    email?: string;
    phone?: string;
    name: string;
    password?: string;
    role?: UserRole;
}

export interface LoginRequest {
    email?: string;
    phone?: string;
    password?: string;
}

export interface SendOtpRequest {
    phone: string;
}

export interface VerifyOtpRequest {
    phone: string;
    code: string;
    name?: string;
}

export interface SocialLoginRequest {
    idToken: string;
}

export interface CompleteOnboardingRequest {
    role: UserRole;
    email?: string;
    name?: string;
    businessName?: string;
    skills?: string[];
    description?: string;
    businessCategory?: string;
    locationName?: string;
    latitude?: number;
    longitude?: number;
    selectedPlan?: 'STARTER' | 'PRO' | 'ELITE';
}
