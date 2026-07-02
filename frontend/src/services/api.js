import axios from 'axios';

// In local dev, Vite's proxy handles /api -> localhost:8080 (see vite.config.js).
// In production (e.g. Vercel), set VITE_API_BASE_URL to your deployed backend's
// URL, e.g. https://helping-hands-backend.onrender.com/api/v1
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
});

// Attach the JWT to every outgoing request once the user is logged in.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hh_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handling: token is invalid/expired -> force re-login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hh_access_token');
      localStorage.removeItem('hh_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
