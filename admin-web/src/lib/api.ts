import axios from 'axios';

// Since the admin-web usually runs on 3001 and api on 3000 locally
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

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
