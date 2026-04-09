import { create } from 'zustand';
import type { User, RegisterRequest, LoginRequest, CompleteOnboardingRequest } from '../types/auth';
import { authApi } from '../lib/auth';
import { saveTokens, saveUser, clearAll, getAccessToken, getRefreshToken, getUser, getVisitedOnboarding, setVisitedOnboarding } from '../lib/storage';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    accessToken: string | null;
    error: string | null;
    hasVisitedOnboarding: boolean;
    sessionExpired: boolean;

    // Actions
    initialize: () => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    login: (data: LoginRequest) => Promise<void>;
    loginWithOtp: (phone: string, code: string, name?: string) => Promise<void>;
    loginWithGoogle: (idToken: string) => Promise<void>;
    completeOnboarding: (data: CompleteOnboardingRequest) => Promise<void>;
    completeIntroOnboarding: () => Promise<void>;
    sendOtp: (data: { phone: string }) => Promise<void>;
    logout: () => Promise<void>;
    updateLocation: (latitude: number, longitude: number, locationName: string) => Promise<void>;
    updateProfile: (data: { name?: string; email?: string; avatarUrl?: string }) => Promise<void>;
    setSessionExpired: (expired: boolean) => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    accessToken: null,
    error: null,
    hasVisitedOnboarding: false,
    sessionExpired: false,

    initialize: async () => {
        try {
            const visited = await getVisitedOnboarding();
            set({ hasVisitedOnboarding: visited });

            const accessToken = await getAccessToken();
            const refreshToken = await getRefreshToken();

            // 1. If no tokens at all, we are definitely not authenticated
            if (!accessToken && !refreshToken) {
                set({ isInitialized: true, isAuthenticated: false, accessToken: null, user: null });
                return;
            }

            // 2. Load cached user first to prevent UI flickering if we have some token
            const cachedUser = await getUser();
            if (cachedUser) {
                set({ user: cachedUser, isAuthenticated: true, accessToken: accessToken });
            }

            // 3. Attempt to validate/refresh session with API
            try {
                // If we have no access token but have refresh token, the interceptor in api.ts 
                // will handle the refresh when we call getMe() if we configure it right,
                // BUT it's safer to explicitly check here or let the first API call handle it.
                const { data } = await authApi.getMe();

                // Update cache with fresh data
                await saveUser(data.user);
                set({
                    user: data.user,
                    isAuthenticated: true,
                    isInitialized: true,
                    accessToken: await getAccessToken() // Get potentially refreshed token
                });
            } catch (err: any) {
                // Determine if error is terminal (auth failure) or transient (network)
                const isAuthError = err.response?.status === 401 || err.response?.status === 403;

                if (isAuthError) {
                    // Token truly invalid/expired and refresh failed — clear and redirect
                    await clearAll();
                    set({ user: null, isAuthenticated: false, isInitialized: true, accessToken: null });
                } else {
                    // Network error or server down — stay authenticated with cached data
                    // This is the core of "persistent auth" while offline
                    set({ isInitialized: true });
                    console.log('Initialize: Network error, proceeding with cached session');
                }
            }
        } catch (error) {
            console.error('Initialize failed:', error);
            set({ isInitialized: true, isAuthenticated: false, accessToken: null });
        }
    },

    register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
            await authApi.register(data);
            // Registration successful! We do NOT log the user in here.
            // Strict logic requires them to verify their OTP first.
            set({ isLoading: false });
        } catch (err: any) {
            const message = err.response?.data?.message || 'Registration failed';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },

    login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
            const { data: response } = await authApi.login(data);
            await saveTokens(response.accessToken, response.refreshToken);
            await saveUser(response.user);
            set({ user: response.user, isAuthenticated: true, isLoading: false, accessToken: response.accessToken });
        } catch (err: any) {
            const message = err.response?.data?.message || 'Login failed';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },

    loginWithOtp: async (phone: string, code: string, name?: string) => {
        set({ isLoading: true, error: null });
        try {
            const { data: response } = await authApi.verifyOtp({ phone, code, name });
            await saveTokens(response.accessToken, response.refreshToken);
            await saveUser(response.user);
            set({ user: response.user, isAuthenticated: true, isLoading: false, accessToken: response.accessToken });
        } catch (err: any) {
            const message = err.response?.data?.message || 'OTP verification failed';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },

    loginWithGoogle: async (idToken: string) => {
        set({ isLoading: true, error: null });
        try {
            const { data: response } = await authApi.googleLogin({ idToken });
            await saveTokens(response.accessToken, response.refreshToken);
            await saveUser(response.user);
            set({ user: response.user, isAuthenticated: true, isLoading: false, accessToken: response.accessToken });
        } catch (err: any) {
            const message = err.response?.data?.message || 'Google login failed';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },

    completeOnboarding: async (data: CompleteOnboardingRequest) => {
        set({ isLoading: true, error: null });
        try {
            const { data: response } = await authApi.completeOnboarding(data);
            if ((response as any).accessToken) {
                await saveTokens((response as any).accessToken, (response as any).refreshToken);
            }
            await saveUser(response.user);
            set({
                user: response.user,
                isLoading: false,
                ...((response as any).accessToken && { accessToken: (response as any).accessToken, isAuthenticated: true })
            });
        } catch (err: any) {
            const message = err.response?.data?.message || 'Onboarding failed';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },

    sendOtp: async (data: { phone: string }) => {
        set({ isLoading: true, error: null });
        try {
            await authApi.sendOtp(data);
            set({ isLoading: false });
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to send OTP';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },

    completeIntroOnboarding: async () => {
        await setVisitedOnboarding();
        set({ hasVisitedOnboarding: true });
    },

    logout: async () => {
        try {
            await authApi.logout();
        } catch {
            // Server logout can fail silently
        } finally {
            await clearAll();
            set({ user: null, isAuthenticated: false, error: null, accessToken: null, sessionExpired: false });
        }
    },

    setSessionExpired: (expired: boolean) => set({ sessionExpired: expired }),

    clearError: () => set({ error: null }),

    updateLocation: async (latitude: number, longitude: number, locationName: string) => {
        try {
            const { data } = await authApi.updateLocation({ locationName, latitude, longitude });
            await saveUser(data.user);
            set({ user: data.user });
        } catch (err: any) {
            console.error('Failed to update location:', err.message);
        }
    },

    updateProfile: async (data: { name?: string; email?: string; avatarUrl?: string }) => {
        set({ isLoading: true, error: null });
        try {
            const { data: response } = await authApi.updateProfile(data);
            await saveUser(response.user);
            set({ user: response.user, isLoading: false });
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to update profile';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },
}));
