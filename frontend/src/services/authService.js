import api from './api';

export async function login(usernameOrEmail, password) {
  const { data } = await api.post('/auth/login', { usernameOrEmail, password });
  return data.data; // ApiResponse envelope -> AuthResponse payload
}

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload);
  return data.data;
}
