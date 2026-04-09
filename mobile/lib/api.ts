import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import ENV from '../constants/config';
import { getAccessToken, getRefreshToken, saveTokens, clearAll } from './storage';
import { useAuthStore } from '../store/useAuthStore';

export const API_BASE_URL = ENV.API_URL;

const api = axios.create({
    baseURL: ENV.API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Request Interceptor: Attach access token ───
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await getAccessToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// ─── Response Interceptor: Handle 401 + token refresh ───
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else if (token) {
            resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => {
        // Automatically unwrap the { success, data, message } backend response standard
        if (response.data && response.data.success !== undefined && response.data.data !== undefined) {
            return {
                ...response,
                data: response.data.data,
                // Attach message to response object for components that might want to read it
                message: response.data.message
            } as any;
        }
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle both 401 (expired token) and 403 (stale role after onboarding)
        const status = error.response?.status;
        if ((status === 401 || status === 403) && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve: (token: string) => {
                            if (originalRequest.headers) {
                                originalRequest.headers.Authorization = `Bearer ${token}`;
                            }
                            resolve(api(originalRequest));
                        },
                        reject,
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await getRefreshToken();
                if (!refreshToken) {
                    return Promise.reject(new Error('No refresh token found'));
                }

                const { data } = await axios.post(`${ENV.API_URL}/api/v1/auth/refresh`, {
                    refreshToken,
                });

                // Since we used raw axios, the response is NOT unwrapped by the interceptor
                const newTokens = data.data;

                await saveTokens(newTokens.accessToken, newTokens.refreshToken);
                processQueue(null, newTokens.accessToken);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
                }
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                await clearAll();
                // Trigger session expired modal instead of silent failure
                useAuthStore.getState().setSessionExpired(true);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    },
);

export const getImageUrl = (path: string | undefined | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${ENV.API_URL}${cleanPath}`;
};

export default api;
