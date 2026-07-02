import api from './api';

export async function login(usernameOrEmail, password) {
  const { data } = await api.post('/auth/login', { usernameOrEmail, password });
  return data.data; // ApiResponse envelope -> AuthResponse payload
}

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload);
  return data.data;
}

export async function verifyEmail(token) {
  const { data } = await api.get('/auth/verify-email', { params: { token } });
  return data.message;
}

export async function resendVerification() {
  const { data } = await api.post('/auth/resend-verification');
  return data.message;
}

export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data.message;
}

export async function resetPassword(token, newPassword) {
  const { data } = await api.post('/auth/reset-password', { token, newPassword });
  return data.message;
}
