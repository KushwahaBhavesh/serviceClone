import axios from 'axios';

// The admin panel now handles its own administrative routes as a standalone full-stack Next.js app.
// It also needs to know where the main backend is for images if they are not proxied.
const API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || '/api/v1';
const MAIN_BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || '';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to handle authentication tokens and errors
api.interceptors.request.use((config) => {
  // Try to get token from storage if not already set
  // This is a safety measure if the store's setAuth/onRehydrate missed it
  if (typeof window !== 'undefined' && !config.headers.Authorization) {
    const storage = localStorage.getItem('admin-auth-storage');
    if (storage) {
      const { state } = JSON.parse(storage);
      if (state.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin-auth-storage');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getImageUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;

  // If the path starts with /uploads, it's likely served from the main backend
  if (path.startsWith('/uploads') && MAIN_BACKEND_URL) {
    return `${MAIN_BACKEND_URL}${path}`;
  }

  const baseUrl = API_URL.replace('/api/v1', '');
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};
