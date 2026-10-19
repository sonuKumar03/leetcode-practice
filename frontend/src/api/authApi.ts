import { apiRequest } from './client';
import type { User } from '../types';

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export const authApi = {
  register: (email: string, password: string): Promise<TokenResponse> => {
    return apiRequest<TokenResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  login: (email: string, password: string): Promise<TokenResponse> => {
    return apiRequest<TokenResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getMe: (): Promise<User> => {
    return apiRequest<User>('/api/v1/auth/me');
  },

  logout: (): Promise<{ status: string }> => {
    return apiRequest<{ status: string }>('/api/v1/auth/logout', {
      method: 'POST',
    });
  },
};
