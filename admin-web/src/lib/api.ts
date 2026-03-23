import axios from 'axios';

// The admin panel now handles its own administrative routes as a standalone full-stack Next.js app.
const API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getImageUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = API_URL.replace('/api/v1', '');
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};
