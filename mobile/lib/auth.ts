import api from './api';
import type {
    AuthResponse,
    RegisterRequest,
    LoginRequest,
    SendOtpRequest,
    VerifyOtpRequest,
    SocialLoginRequest,
    CompleteOnboardingRequest,
    User,
} from '../types/auth';

const AUTH_BASE = '/api/v1/auth';

export const authApi = {
    register: (data: RegisterRequest) =>
        api.post<AuthResponse>(`${AUTH_BASE}/register`, data),

    login: (data: LoginRequest) =>
        api.post<AuthResponse>(`${AUTH_BASE}/login`, data),

    sendOtp: (data: SendOtpRequest) =>
        api.post<{ message: string; expiresInSeconds: number; devCode?: string }>(
            `${AUTH_BASE}/otp/send`,
            data,
        ),

    verifyOtp: (data: VerifyOtpRequest) =>
        api.post<AuthResponse>(`${AUTH_BASE}/otp/verify`, data),

    googleLogin: (data: SocialLoginRequest) =>
        api.post<AuthResponse>(`${AUTH_BASE}/social/google`, data),

    refreshTokens: (refreshToken: string) =>
        api.post<AuthResponse>(`${AUTH_BASE}/refresh`, { refreshToken }),

    logout: () =>
        api.delete(`${AUTH_BASE}/logout`),

    getMe: () =>
        api.get<{ user: User }>(`${AUTH_BASE}/me`),

    completeOnboarding: (data: CompleteOnboardingRequest) =>
        api.put<{ user: User }>(`${AUTH_BASE}/onboarding`, data),

    updateLocation: (data: { locationName: string; latitude: number; longitude: number }) =>
        api.put<{ user: User }>(`${AUTH_BASE}/location`, data),

    updateProfile: (data: { name?: string; email?: string; avatarUrl?: string }) =>
        api.put<{ user: User }>(`${AUTH_BASE}/profile`, data),

    checkPhone: (phone: string) =>
        api.post<{ exists: boolean }>(`${AUTH_BASE}/check-phone`, { phone }),
};
